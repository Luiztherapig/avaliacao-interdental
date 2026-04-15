import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalBootstrap, shouldUseLocalPublicFallback } from "@/lib/dev/public-fallback";
import type { BootstrapPayload, PublicQuestion } from "@/lib/types/database";

export async function getPublicBootstrap(unitSlug: string): Promise<BootstrapPayload | null> {
  if (shouldUseLocalPublicFallback()) {
    return getLocalBootstrap(unitSlug);
  }

  const supabase = createAdminClient();

  try {
    const { data: unit } = await supabase
      .from("units")
      .select("id, name, slug, is_active")
      .eq("slug", unitSlug)
      .eq("is_active", true)
      .single();

    if (!unit) return null;

    const [{ data: settings }, { data: dentists }, { data: questionnaire }] = await Promise.all([
      supabase
        .from("app_settings")
        .select("brand_name, landing_title, landing_subtitle, public_form_enabled")
        .eq("unit_id", unit.id)
        .single(),
      supabase
        .from("dentists")
        .select("id, name, specialty")
        .eq("unit_id", unit.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("questionnaires")
        .select("id, version_number, title")
        .eq("unit_id", unit.id)
        .eq("status", "published")
        .single()
    ]);

    let questions: PublicQuestion[] = [];

    if (questionnaire) {
      const { data } = await supabase
        .from("questions")
        .select(
          "id, code, label, description, type, is_required, display_order, options_json, conditional_logic_json"
        )
        .eq("questionnaire_id", questionnaire.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      questions = (data ?? []) as PublicQuestion[];
    }

    return {
      unit: {
        id: unit.id,
        name: unit.name,
        slug: unit.slug
      },
      settings: {
        brand_name: settings?.brand_name ?? unit.name,
        landing_title: settings?.landing_title ?? null,
        landing_subtitle: settings?.landing_subtitle ?? null,
        public_form_enabled: settings?.public_form_enabled ?? false
      },
      dentists: dentists ?? [],
      questionnaire: questionnaire
        ? {
            id: questionnaire.id,
            version_number: questionnaire.version_number,
            title: questionnaire.title,
            questions
          }
        : null
    };
  } catch {
    return getLocalBootstrap(unitSlug);
  }
}
