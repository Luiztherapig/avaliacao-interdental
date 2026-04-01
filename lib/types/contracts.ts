import type { BootstrapPayload } from "@/lib/types/database";
import type { DentistFormInput, QuestionnaireDraftInput, SettingsInput } from "@/lib/types/forms";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type BootstrapResponse = ApiResponse<BootstrapPayload>;

export type SubmitSurveyResponse = ApiResponse<{
  submissionId: string;
  classification: "elogio" | "neutro" | "atencao" | "critico";
  isCritical: boolean;
}>;

export type DashboardResponse = ApiResponse<{
  totalSubmissions: number;
  averageScore: number | null;
  criticalCount: number;
  criticalRate: number;
  withComments: number;
  classificationBreakdown: Array<{ label: string; count: number }>;
  trend: Array<{ date: string; total: number }>;
  dentists: Array<{
    dentistId: string;
    dentistName: string;
    total: number;
    averageScore: number | null;
    criticalCount: number;
  }>;
  latestCritical: Array<{
    id: string;
    submittedAt: string;
    dentistName: string;
    ratingOverall: number;
    criticalReason: string | null;
  }>;
}>;

export type DentistsResponse = ApiResponse<{
  dentists: Array<{
    id: string;
    name: string;
    specialty: string | null;
    isActive: boolean;
    displayOrder: number;
    updatedAt: string;
  }>;
}>;

export type DentistMutationResponse = ApiResponse<{
  dentist: DentistFormInput & { id: string };
}>;

export type QuestionnaireResponse = ApiResponse<{
  versions: Array<{
    id: string;
    versionNumber: number;
    title: string;
    status: "draft" | "published" | "archived";
    publishedAt: string | null;
  }>;
  activeDraft: {
    id: string;
    title: string;
    description: string | null;
    versionNumber: number;
    questions: Array<{
      id: string;
      code: string;
      label: string;
      description: string | null;
      type: string;
      isRequired: boolean;
      isActive: boolean;
      displayOrder: number;
      options: Array<{ label: string; value: string }>;
      conditionalRule: unknown;
      criticalRule: unknown;
    }>;
  } | null;
}>;

export type QuestionnaireMutationResponse = ApiResponse<{
  questionnaireId: string;
  payload: QuestionnaireDraftInput;
}>;

export type SettingsResponse = ApiResponse<{
  settings: SettingsInput;
}>;
