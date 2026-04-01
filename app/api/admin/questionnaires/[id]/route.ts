import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { questionnaireDraftSchema } from "@/lib/types/forms";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile } = await requireAdmin();
    const payload = questionnaireDraftSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { data: questionnaire } = await supabase
      .from("questionnaires")
      .select("id, unit_id, status")
      .eq("id", id)
      .eq("unit_id", profile.unit_id)
      .single();

    if (!questionnaire || questionnaire.status !== "draft") {
      throw new Error("Apenas versões em rascunho podem ser editadas.");
    }

    const { error: questionnaireError } = await supabase
      .from("questionnaires")
      .update({
        title: payload.title,
        description: payload.description || null
      })
      .eq("id", id);

    if (questionnaireError) throw questionnaireError;

    const { error: deleteError } = await supabase.from("questions").delete().eq("questionnaire_id", id);
    if (deleteError) throw deleteError;

    const rows = payload.questions.map((question) => ({
      id: randomUUID(),
      questionnaire_id: id,
      code: question.code,
      label: question.label,
      description: question.description || null,
      type: question.type,
      is_required: question.isRequired,
      is_active: question.isActive,
      display_order: question.displayOrder,
      options_json: question.options ?? null,
      conditional_logic_json: question.conditionalRule ?? null,
      critical_answer_rules_json: question.criticalRule ?? null
    }));

    const { error: questionsError } = await supabase.from("questions").insert(rows);
    if (questionsError) throw questionsError;

    return NextResponse.json({
      success: true,
      data: {
        questionnaireId: id,
        payload
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar questionário." },
      { status: 400 }
    );
  }
}
