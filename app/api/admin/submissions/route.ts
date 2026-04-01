import { NextResponse } from "next/server";

import { getSubmissions } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const { profile } = await requireAdmin();
  const { searchParams } = new URL(request.url);

  const submissions = await getSubmissions(profile.unit_id, {
    dentistId: searchParams.get("dentistId") ?? undefined,
    classification: searchParams.get("classification") ?? undefined
  });

  return NextResponse.json({ success: true, data: { submissions } });
}
