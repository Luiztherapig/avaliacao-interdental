import { NextResponse } from "next/server";

import { getDentists } from "@/lib/queries/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { dentistFormSchema } from "@/lib/types/forms";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { profile } = await requireAdmin();
  const dentists = await getDentists(profile.unit_id);
  return NextResponse.json({ success: true, data: { dentists } });
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAdmin();
    const payload = dentistFormSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("dentists")
      .insert({
        unit_id: profile.unit_id,
        name: payload.name,
        slug: slugify(payload.name),
        specialty: payload.specialty || null,
        is_active: payload.isActive,
        display_order: payload.displayOrder
      })
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
      { success: false, error: error instanceof Error ? error.message : "Falha ao criar dentista." },
      { status: 400 }
    );
  }
}
