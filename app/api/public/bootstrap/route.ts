import { NextResponse } from "next/server";

import { DEFAULT_UNIT_SLUG } from "@/lib/constants/site";
import { getPublicBootstrap } from "@/lib/queries/public";
import type { BootstrapResponse } from "@/lib/types/contracts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitSlug = searchParams.get("unit") ?? DEFAULT_UNIT_SLUG;

  const data = await getPublicBootstrap(unitSlug);

  if (!data) {
    const response: BootstrapResponse = {
      success: false,
      error: "Não foi possível carregar os dados da avaliação."
    };
    return NextResponse.json(response, { status: 404 });
  }

  const response: BootstrapResponse = {
    success: true,
    data
  };

  return NextResponse.json(response);
}
