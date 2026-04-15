import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID, createHash } from "crypto";

import { classifySubmission, detectCriticalReason } from "@/lib/actions/classification";
import type { BootstrapPayload, PublicQuestion } from "@/lib/types/database";
import type { PublicSurveyInput } from "@/lib/types/forms";

const FALLBACK_UNIT_ID = "00000000-0000-0000-0000-000000000001";
const FALLBACK_QUESTIONNAIRE_ID = "00000000-0000-0000-0000-000000000201";

type StoredSubmission = {
  id: string;
  unitSlug: string;
  questionnaireId: string;
  dentistId: string;
  ratingOverall: number;
  commentText: string | null;
  classification: "elogio" | "neutro" | "atencao" | "critico";
  isCritical: boolean;
  criticalReason: string | null;
  submittedAt: string;
  source: PublicSurveyInput["source"];
  answers: PublicSurveyInput["answers"];
  userAgent: string | null;
  ipHash: string | null;
};

const fallbackQuestions: PublicQuestion[] = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    code: "q_overall_rating",
    label: "Como você avalia seu atendimento hoje?",
    description: "Selecione a carinha que melhor representa sua experiência.",
    type: "emoji_rating",
    is_required: true,
    display_order: 10,
    options_json: null,
    conditional_logic_json: null
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    code: "q_team_kindness",
    label: "Como você avalia a cordialidade da equipe?",
    description: null,
    type: "rating",
    is_required: true,
    display_order: 20,
    options_json: null,
    conditional_logic_json: null
  },
  {
    id: "00000000-0000-0000-0000-000000000303",
    code: "q_clear_guidance",
    label: "As orientações passadas foram claras?",
    description: null,
    type: "yes_no",
    is_required: true,
    display_order: 30,
    options_json: null,
    conditional_logic_json: null
  },
  {
    id: "00000000-0000-0000-0000-000000000304",
    code: "q_expected_time",
    label: "Seu atendimento ocorreu dentro do esperado?",
    description: null,
    type: "yes_no",
    is_required: true,
    display_order: 40,
    options_json: null,
    conditional_logic_json: null
  },
  {
    id: "00000000-0000-0000-0000-000000000305",
    code: "q_negative_reason",
    label: "O que mais impactou negativamente sua experiência?",
    description: "Esta pergunta aparece apenas quando a nota geral é baixa.",
    type: "text",
    is_required: true,
    display_order: 50,
    options_json: null,
    conditional_logic_json: {
      dependsOnQuestionCode: "q_overall_rating",
      operator: "lte",
      value: 2,
      requiredWhenVisible: true
    }
  }
];

export const fallbackBootstrap: BootstrapPayload = {
  unit: {
    id: FALLBACK_UNIT_ID,
    name: "Interdental",
    slug: "interdental"
  },
  settings: {
    brand_name: "Interdental",
    landing_title: "Sua opinião ajuda a Interdental a cuidar melhor de cada atendimento.",
    landing_subtitle: "A avaliação é rápida, leva menos de 1 minuto e nos ajuda a evoluir com mais precisão.",
    public_form_enabled: true
  },
  dentists: [
    {
      id: "00000000-0000-0000-0000-000000000101",
      name: "Dra. Mariana Costa",
      specialty: "Ortodontia"
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      name: "Dr. Rafael Lima",
      specialty: "Clínico Geral"
    }
  ],
  questionnaire: {
    id: FALLBACK_QUESTIONNAIRE_ID,
    version_number: 1,
    title: "Pesquisa Equilibrada",
    questions: fallbackQuestions
  }
};

function isPlaceholder(value: string | undefined) {
  return !value || value.startsWith("COLE_AQUI");
}

export function shouldUseLocalPublicFallback() {
  return (
    isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getLocalBootstrap(unitSlug: string) {
  if (unitSlug !== fallbackBootstrap.unit.slug) return null;
  return fallbackBootstrap;
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

function isQuestionVisible(question: PublicQuestion, answerMap: Record<string, unknown>) {
  const conditional = question.conditional_logic_json as
    | {
        dependsOnQuestionCode: string;
        operator: "equals" | "not_equals" | "lte" | "gte" | "in";
        value: string | number | boolean | string[];
      }
    | null;

  if (!conditional) return true;

  const current = answerMap[conditional.dependsOnQuestionCode];

  switch (conditional.operator) {
    case "equals":
      return current === conditional.value;
    case "not_equals":
      return current !== conditional.value;
    case "lte":
      return typeof current === "number" && typeof conditional.value === "number"
        ? current <= conditional.value
        : false;
    case "gte":
      return typeof current === "number" && typeof conditional.value === "number"
        ? current >= conditional.value
        : false;
    case "in":
      return Array.isArray(conditional.value) ? conditional.value.includes(String(current)) : false;
  }
}

function hasValue(answer: PublicSurveyInput["answers"][number] | undefined) {
  return Boolean(
    answer &&
      (typeof answer.answerNumber === "number" ||
        typeof answer.answerBoolean === "boolean" ||
        (answer.answerOption && answer.answerOption.trim()) ||
        (answer.answerText && answer.answerText.trim()))
  );
}

const submissionsFile = join("/tmp", "interdental-public-submissions.json");

async function readStoredSubmissions() {
  try {
    const raw = await readFile(submissionsFile, "utf-8");
    return JSON.parse(raw) as StoredSubmission[];
  } catch {
    return [];
  }
}

async function writeStoredSubmissions(submissions: StoredSubmission[]) {
  await mkdir("/tmp", { recursive: true });
  await writeFile(submissionsFile, JSON.stringify(submissions, null, 2));
}

export async function submitLocalSurvey(
  input: PublicSurveyInput,
  metadata: { userAgent?: string; ip?: string }
) {
  const data = getLocalBootstrap(input.unitSlug);

  if (!data || !data.questionnaire) {
    throw new Error("Unidade não encontrada.");
  }

  if (!data.settings.public_form_enabled) {
    throw new Error("Formulário indisponível.");
  }

  if (input.questionnaireId !== data.questionnaire.id) {
    throw new Error("Questionário inválido.");
  }

  const dentist = data.dentists.find((item) => item.id === input.dentistId);

  if (!dentist) {
    throw new Error("Dentista inválido.");
  }

  const answerMap = toAnswerByCode(data.questionnaire.questions, input.answers);

  for (const question of data.questionnaire.questions) {
    if (!question.is_required) continue;
    if (!isQuestionVisible(question, answerMap)) continue;

    const answer = input.answers.find((item) => item.questionId === question.id);

    if (!hasValue(answer)) {
      throw new Error(`Resposta obrigatória ausente: ${question.label}`);
    }
  }

  const threshold = 2;
  const criticalReason = detectCriticalReason({
    ratingOverall: input.ratingOverall,
    threshold,
    questions: data.questionnaire.questions,
    answers: input.answers
  });

  const classification = classifySubmission({
    ratingOverall: input.ratingOverall,
    criticalReason
  });

  const stored = await readStoredSubmissions();
  const submissionId = randomUUID();

  stored.push({
    id: submissionId,
    unitSlug: input.unitSlug,
    questionnaireId: input.questionnaireId,
    dentistId: input.dentistId,
    ratingOverall: input.ratingOverall,
    commentText: input.commentText || null,
    classification,
    isCritical: classification === "critico",
    criticalReason,
    submittedAt: new Date().toISOString(),
    source: input.source,
    answers: input.answers,
    userAgent: metadata.userAgent ?? null,
    ipHash: metadata.ip ? createHash("sha256").update(metadata.ip).digest("hex") : null
  });

  await writeStoredSubmissions(stored);

  return {
    submissionId,
    classification,
    isCritical: classification === "critico"
  };
}
