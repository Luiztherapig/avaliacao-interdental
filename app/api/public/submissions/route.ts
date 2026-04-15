import { NextResponse } from "next/server";

import { shouldUseLocalPublicFallback } from "@/lib/dev/public-fallback";

export async function GET() {
  if (!shouldUseLocalPublicFallback()) {
    return NextResponse.json(
      {
        success: false,
        error: "Endpoint disponível apenas no fallback local."
      },
      { status: 404 }
    );
  }

  try {
    const fs = await import("fs/promises");
    const raw = await fs.readFile("/tmp/interdental-public-submissions.json", "utf-8");

    return NextResponse.json({
      success: true,
      data: JSON.parse(raw)
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}
