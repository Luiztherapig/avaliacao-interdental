import { z } from "zod";

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  type: z.enum(["emoji_rating", "rating", "yes_no", "single_choice", "text"]),
  answerNumber: z.number().min(1).max(5).optional(),
  answerBoolean: z.boolean().optional(),
  answerOption: z.string().optional(),
  answerText: z.string().max(1500).optional()
});

export const publicSurveySchema = z.object({
  unitSlug: z.string().min(1),
  source: z.enum(["qr", "whatsapp", "direct"]),
  dentistId: z.string().uuid(),
  questionnaireId: z.string().uuid(),
  ratingOverall: z.number().min(1).max(5),
  commentText: z.string().max(1500).optional().or(z.literal("")),
  answers: z.array(answerSchema).min(1)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const dentistFormSchema = z.object({
  name: z.string().min(2).max(120),
  specialty: z.string().max(120).optional().or(z.literal("")),
  isActive: z.boolean(),
  displayOrder: z.coerce.number().int().min(0)
});

export const questionRuleSchema = z
  .object({
    dependsOnQuestionCode: z.string().min(1),
    operator: z.enum(["equals", "not_equals", "lte", "gte", "in"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    requiredWhenVisible: z.boolean().default(false)
  })
  .optional();

export const criticalRuleSchema = z
  .object({
    operator: z.enum(["equals", "lte", "gte"]),
    value: z.union([z.string(), z.number(), z.boolean()])
  })
  .optional();

export const questionnaireQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(60),
  label: z.string().min(5).max(255),
  description: z.string().max(255).optional().or(z.literal("")),
  type: z.enum(["emoji_rating", "rating", "yes_no", "single_choice", "text"]),
  isRequired: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  conditionalRule: questionRuleSchema,
  criticalRule: criticalRuleSchema
});

export const questionnaireDraftSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(255).optional().or(z.literal("")),
  questions: z.array(questionnaireQuestionSchema).min(1)
});

export const settingsSchema = z.object({
  publicFormEnabled: z.boolean(),
  criticalThresholdNumber: z.coerce.number().min(1).max(5),
  notificationEmails: z.array(z.string().email()).min(1),
  brandName: z.string().max(120).optional().or(z.literal("")),
  whatsappLink: z.string().url().optional().or(z.literal("")),
  landingTitle: z.string().max(180).optional().or(z.literal("")),
  landingSubtitle: z.string().max(255).optional().or(z.literal(""))
});

export type PublicSurveyInput = z.infer<typeof publicSurveySchema>;
export type DentistFormInput = z.infer<typeof dentistFormSchema>;
export type QuestionnaireDraftInput = z.infer<typeof questionnaireDraftSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
