import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { dentistFormSchema } from "@/lib/types/forms";
import { slugify } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile } = await requireAdmin();
    const payload = dentistFormSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("dentists")
      .update({
        name: payload.name,
        slug: slugify(payload.name),
        specialty: payload.specialty || null,
        is_active: payload.isActive,
        display_order: payload.displayOrder
      })
      .eq("id", id)
      .eq("unit_id", profile.unit_id)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        dentist: {
          id: data.id,
          ...payload
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar dentista." },
      { status: 400 }
    );
  }
}
