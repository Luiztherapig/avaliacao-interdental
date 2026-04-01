import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile } = await requireAdmin();
    const supabase = createAdminClient();

    const { data: questionnaire } = await supabase
      .from("questionnaires")
      .select("id, unit_id, status")
      .eq("id", id)
      .eq("unit_id", profile.unit_id)
      .single();

    if (!questionnaire || questionnaire.status !== "draft") {
      throw new Error("Apenas versões em rascunho podem ser publicadas.");
    }

    await supabase
      .from("questionnaires")
      .update({ status: "archived" })
      .eq("unit_id", profile.unit_id)
      .eq("status", "published");

    const { error } = await supabase
      .from("questionnaires")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { questionnaireId: id } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Falha ao publicar versão." },
      { status: 400 }
    );
  }
}
