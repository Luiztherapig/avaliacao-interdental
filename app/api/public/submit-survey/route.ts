import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { submitSurvey } from "@/lib/actions/survey";
import { publicSurveySchema } from "@/lib/types/forms";
import type { SubmitSurveyResponse } from "@/lib/types/contracts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = publicSurveySchema.parse(body);
    const headerStore = await headers();

    const data = await submitSurvey(payload, {
      userAgent: headerStore.get("user-agent") ?? undefined,
      ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
    });

    const response: SubmitSurveyResponse = {
      success: true,
      data
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: SubmitSurveyResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao enviar avaliação."
    };
    return NextResponse.json(response, { status: 400 });
  }
}
