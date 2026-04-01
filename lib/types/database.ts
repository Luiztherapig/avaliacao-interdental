export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestionType = "emoji_rating" | "rating" | "yes_no" | "single_choice" | "text";
export type SurveySource = "qr" | "whatsapp" | "direct";
export type SubmissionClassification = "elogio" | "neutro" | "atencao" | "critico";
export type QuestionnaireStatus = "draft" | "published" | "archived";

export type PublicQuestion = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  type: QuestionType;
  is_required: boolean;
  display_order: number;
  options_json: Json | null;
  conditional_logic_json: Json | null;
};

export type BootstrapPayload = {
  unit: {
    id: string;
    name: string;
    slug: string;
  };
  settings: {
    brand_name: string | null;
    landing_title: string | null;
    landing_subtitle: string | null;
    public_form_enabled: boolean;
  };
  dentists: Array<{
    id: string;
    name: string;
    specialty: string | null;
  }>;
  questionnaire: {
    id: string;
    version_number: number;
    title: string;
    questions: PublicQuestion[];
  } | null;
};
