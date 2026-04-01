import type { PublicQuestion, SubmissionClassification } from "@/lib/types/database";

type SubmittedAnswer = {
  questionId: string;
  type: string;
  answerNumber?: number;
  answerBoolean?: boolean;
  answerOption?: string;
  answerText?: string;
};

type CriticalRule = {
  operator: "equals" | "lte" | "gte";
  value: string | number | boolean;
};

type PublicQuestionWithRules = PublicQuestion & {
  critical_answer_rules_json?: CriticalRule | null;
};

export function detectCriticalReason(params: {
  ratingOverall: number;
  threshold: number;
  questions: PublicQuestion[];
  answers: SubmittedAnswer[];
}) {
  if (params.ratingOverall <= params.threshold) {
    return `Nota geral ${params.ratingOverall} abaixo ou igual ao limite ${params.threshold}`;
  }

  for (const answer of params.answers) {
    const question = params.questions.find(
      (item) => item.id === answer.questionId
    ) as PublicQuestionWithRules | undefined;

    const rule = question?.critical_answer_rules_json ?? null;

    if (!question || !rule) continue;

    const currentValue =
      answer.answerNumber ??
      answer.answerBoolean ??
      answer.answerOption ??
      answer.answerText;

    if (rule.operator === "equals" && currentValue === rule.value) {
      return `Resposta crítica na pergunta "${question.label}"`;
    }

    if (
      rule.operator === "lte" &&
      typeof currentValue === "number" &&
      typeof rule.value === "number" &&
      currentValue <= rule.value
    ) {
      return `Pontuação crítica na pergunta "${question.label}"`;
    }

    if (
      rule.operator === "gte" &&
      typeof currentValue === "number" &&
      typeof rule.value === "number" &&
      currentValue >= rule.value
    ) {
      return `Pontuação crítica na pergunta "${question.label}"`;
    }
  }

  return null;
}

export function classifySubmission(params: {
  ratingOverall: number;
  criticalReason: string | null;
}): SubmissionClassification {
  if (params.criticalReason || params.ratingOverall < 2.5) {
    return "critico";
  }

  if (params.ratingOverall < 3.5) {
    return "atencao";
  }

  if (params.ratingOverall >= 4.5) {
    return "elogio";
  }

  return "neutro";
}