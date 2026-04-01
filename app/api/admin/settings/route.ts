import { NextResponse } from "next/server";

import { getSettings } from "@/lib/queries/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { settingsSchema } from "@/lib/types/forms";

export async function GET() {
  const { profile } = await requireAdmin();
  const settings = await getSettings(profile.unit_id);
  return NextResponse.json({ success: true, data: { settings } });
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAdmin();
    const payload = settingsSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("app_settings")
      .update({
        public_form_enabled: payload.publicFormEnabled,
        critical_threshold_number: payload.criticalThresholdNumber,
        notification_emails_json: payload.notificationEmails,
        brand_name: payload.brandName || null,
        whatsapp_link: payload.whatsappLink || null,
        landing_title: payload.landingTitle || null,
        landing_subtitle: payload.landingSubtitle || null
      })
      .eq("unit_id", profile.unit_id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { settings: payload } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar configurações." },
      { status: 400 }
    );
  }
}
