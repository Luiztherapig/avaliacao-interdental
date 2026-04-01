import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getQuestionnaires } from "@/lib/queries/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { questionnaireDraftSchema } from "@/lib/types/forms";

export async function GET() {
  const { profile } = await requireAdmin();
  const data = await getQuestionnaires(profile.unit_id);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAdmin();
    const payload = questionnaireDraftSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { data: latestVersion } = await supabase
      .from("questionnaires")
      .select("version_number")
      .eq("unit_id", profile.unit_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const questionnaireId = randomUUID();
    const nextVersion = (latestVersion?.version_number ?? 0) + 1;

    const { error: questionnaireError } = await supabase.from("questionnaires").insert({
      id: questionnaireId,
      unit_id: profile.unit_id,
      version_number: nextVersion,
      title: payload.title,
      description: payload.description || null,
      status: "draft",
      created_by: profile.id
    });

    if (questionnaireError) throw questionnaireError;

    const rows = payload.questions.map((question) => ({
      id: randomUUID(),
      questionnaire_id: questionnaireId,
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
        questionnaireId,
        payload
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Falha ao salvar questionário." },
      { status: 400 }
    );
  }
}
