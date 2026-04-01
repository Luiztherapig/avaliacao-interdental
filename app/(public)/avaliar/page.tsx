import { redirect } from "next/navigation";

import { SurveyForm } from "@/components/public/survey-form";
import { DEFAULT_UNIT_SLUG } from "@/lib/constants/site";
import { getPublicBootstrap } from "@/lib/queries/public";

export default async function SurveyPage() {
  const data = await getPublicBootstrap(DEFAULT_UNIT_SLUG);

  if (!data || !data.questionnaire || !data.settings.public_form_enabled) {
    redirect("/");
  }

  return (
    <main className="px-4 py-8">
      <SurveyForm data={data} />
    </main>
  );
}
