import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import type { DashboardResponse } from "@/lib/types/contracts";

export async function GET(request: Request) {
  const { profile } = await requireAdmin();
  const { searchParams } = new URL(request.url);

  const data = await getDashboardData(profile.unit_id, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    dentistId: searchParams.get("dentistId") ?? undefined
  });

  const response: DashboardResponse = {
    success: true,
    data
  };

  return NextResponse.json(response);
}
