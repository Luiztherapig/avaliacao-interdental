import { NextResponse } from "next/server";

import { getSubmissionDetail } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAdmin();
  const detail = await getSubmissionDetail(profile.unit_id, id);

  if (!detail) {
    return NextResponse.json({ success: false, error: "Avaliação não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: detail });
}
