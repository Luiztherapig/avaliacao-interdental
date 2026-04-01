type ConditionalRule = {
  dependsOnQuestionCode: string;
  operator: "equals" | "not_equals" | "lte" | "gte" | "in";
  value: string | number | boolean | string[];
};

export function shouldShowQuestion(
  rule: ConditionalRule | null | undefined,
  answersByCode: Record<string, unknown>
) {
  if (!rule) return true;

  const currentValue = answersByCode[rule.dependsOnQuestionCode];

  switch (rule.operator) {
    case "equals":
      return currentValue === rule.value;
    case "not_equals":
      return currentValue !== rule.value;
    case "lte":
      return typeof currentValue === "number" && typeof rule.value === "number"
        ? currentValue <= rule.value
        : false;
    case "gte":
      return typeof currentValue === "number" && typeof rule.value === "number"
        ? currentValue >= rule.value
        : false;
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(String(currentValue)) : false;
    default:
      return true;
  }
}

export function clearHiddenAnswers<T extends Record<string, unknown>>(
  questions: Array<{ code: string; conditional_logic_json: unknown }>,
  answersByCode: T
) {
  const nextAnswers = { ...answersByCode };

  for (const question of questions) {
    const visible = shouldShowQuestion(
      (question.conditional_logic_json as ConditionalRule | null | undefined) ?? null,
      answersByCode
    );

    if (!visible) {
      delete nextAnswers[question.code];
    }
  }

  return nextAnswers;
}
