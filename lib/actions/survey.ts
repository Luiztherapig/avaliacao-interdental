import { createHash, randomUUID } from "crypto";

import { classifySubmission, detectCriticalReason } from "@/lib/actions/classification";
import { sendCriticalAlertEmail } from "@/lib/email/send-critical-alert";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicQuestion } from "@/lib/types/database";
import type { PublicSurveyInput } from "@/lib/types/forms";

export async function submitSurvey(
  input: PublicSurveyInput,
  metadata: { userAgent?: string; ip?: string }
) {
  const supabase = createAdminClient();

  const { data: unit } = await supabase
    .from("units")
    .select("id, name")
    .eq("slug", input.unitSlug)
    .single();

  if (!unit) throw new Error("Unidade não encontrada.");

  const [{ data: settings }, { data: dentist }, { data: questionnaire }, { data: questions }] =
    await Promise.all([
      supabase
        .from("app_settings")
        .select("critical_threshold_number, notification_emails_json, public_form_enabled")
        .eq("unit_id", unit.id)
        .single(),
      supabase
        .from("dentists")
        .select("id, name, is_active")
        .eq("id", input.dentistId)
        .eq("unit_id", unit.id)
        .single(),
      supabase
        .from("questionnaires")
        .select("id, version_number, status")
        .eq("id", input.questionnaireId)
        .eq("unit_id", unit.id)
        .eq("status", "published")
        .single(),
      supabase
        .from("questions")
        .select(
          "id, code, label, description, type, is_required, is_active, display_order, options_json, conditional_logic_json, critical_answer_rules_json"
        )
        .eq("questionnaire_id", input.questionnaireId)
        .eq("is_active", true),
    ]);

  if (!settings?.public_form_enabled) throw new Error("Formulário indisponível.");
  if (!dentist?.is_active) throw new Error("Dentista inválido.");
  if (!questionnaire) throw new Error("Questionário inválido.");

  const normalizedQuestions: PublicQuestion[] = (questions ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    description: item.description ?? null,
    type: item.type,
    is_required: item.is_required,
    is_active: item.is_active,
    display_order: item.display_order,
    options_json: item.options_json,
    conditional_logic_json: item.conditional_logic_json,
    critical_answer_rules_json: item.critical_answer_rules_json,
  }));

  const questionMap = new Map(normalizedQuestions.map((item) => [item.id, item]));

  for (const question of normalizedQuestions) {
    if (!question.is_required) continue;

    const answer = input.answers.find((item) => item.questionId === question.id);

    const conditional = question.conditional_logic_json as
      | {
          dependsOnQuestionCode: string;
          operator: "equals" | "not_equals" | "lte" | "gte" | "in";
          value: unknown;
          requiredWhenVisible?: boolean;
        }
      | null;

    let visible = true;

    if (conditional) {
      const parent = normalizedQuestions.find(
        (item) => item.code === conditional.dependsOnQuestionCode
      );

      const parentAnswer = input.answers.find((item) => item.questionId === parent?.id);

      const current =
        parentAnswer?.answerNumber ??
        parentAnswer?.answerBoolean ??
        parentAnswer?.answerOption ??
        parentAnswer?.answerText;

      switch (conditional.operator) {
        case "equals":
          visible = current === conditional.value;
          break;
        case "not_equals":
          visible = current !== conditional.value;
          break;
        case "lte":
          visible =
            typeof current === "number" && typeof conditional.value === "number"
              ? current <= conditional.value
              : false;
          break;
        case "gte":
          visible =
            typeof current === "number" && typeof conditional.value === "number"
              ? current >= conditional.value
              : false;
          break;
        case "in":
          visible = Array.isArray(conditional.value)
            ? conditional.value.includes(String(current))
            : false;
          break;
      }
    }

    if (visible && !answer) {
      throw new Error(`Resposta obrigatória ausente: ${question.label}`);
    }
  }

  for (const answer of input.answers) {
    const question = questionMap.get(answer.questionId);

    if (!question) {
      throw new Error("Pergunta inválida.");
    }

    if (question.type === "single_choice") {
      const options = Array.isArray(question.options_json) ? question.options_json : [];
      const exists = options.some((option: any) => option.value === answer.answerOption);

      if (!exists) {
        throw new Error(`Opção inválida para: ${question.label}`);
      }
    }
  }

  const threshold = Number(settings.critical_threshold_number ?? 2);
  const overallCritical = input.ratingOverall <= threshold;

  const criticalReason = detectCriticalReason({
    ratingOverall: input.ratingOverall,
    threshold,
    questions: normalizedQuestions,
    answers: input.answers,
  });

  const questionCritical = Boolean(
    criticalReason && !criticalReason.startsWith("Nota geral")
  );

  const classification = classifySubmission({
    ratingOverall: input.ratingOverall,
    criticalReason,
  });

  const submissionId = randomUUID();
  const sessionId = randomUUID();
  const ipHash = metadata.ip
    ? createHash("sha256").update(metadata.ip).digest("hex")
    : null;

  const { error: submissionError } = await supabase.from("survey_submissions").insert({
    id: submissionId,
    unit_id: unit.id,
    questionnaire_id: questionnaire.id,
    dentist_id: dentist.id,
    dentist_name_snapshot: dentist.name,
    source: input.source,
    rating_overall: input.ratingOverall,
    comment_text: input.commentText || null,
    classification,
    is_critical: classification === "critico",
    critical_reason: criticalReason,
    session_id: sessionId,
    user_agent: metadata.userAgent ?? null,
    ip_hash: ipHash,
  });

  if (submissionError) {
    throw submissionError;
  }

  const answerRows = input.answers.map((answer) => {
    const question = questionMap.get(answer.questionId)!;

    return {
      id: randomUUID(),
      submission_id: submissionId,
      question_id: question.id,
      question_code_snapshot: question.code,
      question_label_snapshot: question.label,
      question_type_snapshot: question.type,
      answer_text: answer.answerText ?? null,
      answer_number: answer.answerNumber ?? null,
      answer_boolean: answer.answerBoolean ?? null,
      answer_option: answer.answerOption ?? null,
    };
  });

  const { error: answersError } = await supabase
    .from("survey_answers")
    .insert(answerRows);

  if (answersError) {
    throw answersError;
  }

  if (classification === "critico" && criticalReason) {
    const notificationEmails = Array.isArray(settings.notification_emails_json)
      ? (settings.notification_emails_json as string[])
      : [];

    const triggerType =
      overallCritical && questionCritical
        ? "combined"
        : overallCritical
          ? "overall_threshold"
          : "question_rule";

    await supabase.from("critical_alerts").insert({
      submission_id: submissionId,
      trigger_type: triggerType,
      trigger_reason: criticalReason,
    });

    try {
      await sendCriticalAlertEmail({
        to: notificationEmails,
        dentistName: dentist.name,
        submittedAt: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date()),
        ratingOverall: input.ratingOverall,
        criticalReason,
        commentText: input.commentText,
      });

      await supabase
        .from("critical_alerts")
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_error: null,
        })
        .eq("submission_id", submissionId);
    } catch (error) {
      await supabase
        .from("critical_alerts")
        .update({
          email_sent: false,
          email_error: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
        })
        .eq("submission_id", submissionId);
    }
  }

  return {
    submissionId,
    classification,
    isCritical: classification === "critico",
  };
}