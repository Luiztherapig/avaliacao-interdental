"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { EmojiRating } from "@/components/public/emoji-rating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { shouldShowQuestion } from "@/lib/forms/conditional-logic";
import { trackEvent } from "@/lib/analytics/posthog";
import { publicSurveySchema, type PublicSurveyInput } from "@/lib/types/forms";
import type { BootstrapPayload, PublicQuestion } from "@/lib/types/database";
import { cn } from "@/lib/utils";

function buildDefaultValues(data: BootstrapPayload): PublicSurveyInput {
  return {
    unitSlug: data.unit.slug,
    source: "direct",
    dentistId: "",
    questionnaireId: data.questionnaire?.id ?? "",
    ratingOverall: 5,
    commentText: "",
    answers: data.questionnaire?.questions.map((question) => ({
      questionId: question.id,
      type: question.type,
      answerNumber: question.code === "q_overall_rating" ? 5 : undefined
    })) ?? []
  };
}

function setAnswer(
  answers: PublicSurveyInput["answers"],
  questionId: string,
  patch: Partial<PublicSurveyInput["answers"][number]>
) {
  return answers.map((answer) =>
    answer.questionId === questionId
      ? {
          ...answer,
          answerText: undefined,
          answerBoolean: undefined,
          answerOption: undefined,
          answerNumber: undefined,
          ...patch
        }
      : answer
  );
}

function toAnswerByCode(questions: PublicQuestion[], answers: PublicSurveyInput["answers"]) {
  const map: Record<string, unknown> = {};
  for (const question of questions) {
    const answer = answers.find((item) => item.questionId === question.id);
    if (!answer) continue;
    map[question.code] =
      answer.answerNumber ?? answer.answerBoolean ?? answer.answerOption ?? answer.answerText;
  }
  return map;
}

export function SurveyForm({ data }: { data: BootstrapPayload }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<PublicSurveyInput>({
    resolver: zodResolver(publicSurveySchema),
    defaultValues: buildDefaultValues(data)
  });

  const questions = data.questionnaire?.questions ?? [];
  const answers = form.watch("answers");
  const answerMap = useMemo(() => toAnswerByCode(questions, answers), [questions, answers]);

  async function onSubmit(values: PublicSurveyInput) {
    setSubmitting(true);

    const visibleQuestionIds = questions
      .filter((question) =>
        shouldShowQuestion(
          (question.conditional_logic_json as {
            dependsOnQuestionCode: string;
            operator: "equals" | "not_equals" | "lte" | "gte" | "in";
            value: string | number | boolean | string[];
          } | null) ?? null,
          answerMap
        )
      )
      .map((question) => question.id);

    const payload: PublicSurveyInput = {
      ...values,
      answers: values.answers.filter((item) => visibleQuestionIds.includes(item.questionId))
    };

    try {
      trackEvent("survey_submitted", {
        source: payload.source,
        questionnaire_version: data.questionnaire?.version_number ?? 1
      });

      const response = await fetch("/api/public/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Não foi possível enviar sua avaliação.");
      }

      router.push(`/obrigado?classification=${result.data.classification}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-3xl p-5 sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Avaliação de atendimento</p>
        <h1 className="mt-3 text-3xl">Leva menos de 1 minuto.</h1>
        <p className="mt-3 text-slate-600">Escolha o dentista, responda as perguntas e envie sua avaliação.</p>
      </div>

      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="dentistId">Com qual dentista você foi atendido?</Label>
          <NativeSelect
            id="dentistId"
            value={form.watch("dentistId")}
            onChange={(event) => {
              form.setValue("dentistId", event.target.value, { shouldValidate: true });
              trackEvent("dentist_selected");
            }}
          >
            <option value="">Selecione</option>
            {data.dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={form.formState.errors.dentistId?.message} />
        </div>

        {questions.map((question) => {
          const visible = shouldShowQuestion(
            (question.conditional_logic_json as {
              dependsOnQuestionCode: string;
              operator: "equals" | "not_equals" | "lte" | "gte" | "in";
              value: string | number | boolean | string[];
            } | null) ?? null,
            answerMap
          );

          if (!visible) return null;

          const index = answers.findIndex((answer) => answer.questionId === question.id);
          const current = answers[index];

          return (
            <div key={question.id} className="rounded-3xl border bg-slate-50/70 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{question.label}</h2>
                {question.description ? <p className="mt-2 text-sm text-slate-500">{question.description}</p> : null}
              </div>

              {question.type === "emoji_rating" ? (
                <EmojiRating
                  value={current?.answerNumber}
                  onChange={(value) => {
                    form.setValue("ratingOverall", value, { shouldValidate: true });
                    form.setValue("answers", setAnswer(form.getValues("answers"), question.id, { answerNumber: value }), {
                      shouldValidate: true
                    });
                  }}
                />
              ) : null}

              {question.type === "rating" ? (
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={cn(
                        "rounded-2xl border bg-white py-3 text-sm font-semibold transition hover:border-primary",
                        current?.answerNumber === value && "border-primary bg-cyan-50 text-primary"
                      )}
                      onClick={() =>
                        form.setValue("answers", setAnswer(form.getValues("answers"), question.id, { answerNumber: value }), {
                          shouldValidate: true
                        })
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}

              {question.type === "yes_no" ? (
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((value) => (
                    <button
                      type="button"
                      key={String(value)}
                      className={cn(
                        "rounded-2xl border bg-white py-3 text-sm font-semibold transition hover:border-primary",
                        current?.answerBoolean === value && "border-primary bg-cyan-50 text-primary"
                      )}
                      onClick={() =>
                        form.setValue("answers", setAnswer(form.getValues("answers"), question.id, { answerBoolean: value }), {
                          shouldValidate: true
                        })
                      }
                    >
                      {value ? "Sim" : "Não"}
                    </button>
                  ))}
                </div>
              ) : null}

              {question.type === "single_choice" ? (
                <NativeSelect
                  value={current?.answerOption ?? ""}
                  onChange={(event) =>
                    form.setValue("answers", setAnswer(form.getValues("answers"), question.id, { answerOption: event.target.value }), {
                      shouldValidate: true
                    })
                  }
                >
                  <option value="">Selecione</option>
                  {Array.isArray(question.options_json)
                    ? (question.options_json as Array<{ label: string; value: string }>).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    : null}
                </NativeSelect>
              ) : null}

              {question.type === "text" ? (
                <Textarea
                  placeholder="Escreva aqui"
                  value={current?.answerText ?? ""}
                  onChange={(event) =>
                    form.setValue("answers", setAnswer(form.getValues("answers"), question.id, { answerText: event.target.value }), {
                      shouldValidate: true
                    })
                  }
                />
              ) : null}
            </div>
          );
        })}

        <div>
          <Label htmlFor="commentText">Se quiser, conte algo que possamos melhorar</Label>
          <Textarea
            id="commentText"
            placeholder="Seu comentário é opcional"
            value={form.watch("commentText") ?? ""}
            onChange={(event) => form.setValue("commentText", event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-3xl bg-cyan-50 px-4 py-4 text-sm text-cyan-800">
          <span>Falta muito pouco. Sua resposta ajuda a melhorar a experiência de outros pacientes.</span>
        </div>

        <Button className="w-full" size="lg" disabled={submitting} type="submit">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitting ? "Enviando avaliação..." : "Enviar avaliação"}
        </Button>
      </form>
    </Card>
  );
}
