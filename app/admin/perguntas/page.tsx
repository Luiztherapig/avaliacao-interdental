import { QuestionnairesManager } from "@/components/admin/questionnaires-manager";
import { getQuestionnaires } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function QuestionsPage() {
  const { profile } = await requireAdmin();
  const questionnaires = await getQuestionnaires(profile.unit_id);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Questionário</p>
        <h1 className="mt-2 text-3xl">Perguntas</h1>
      </div>
      <QuestionnairesManager initialData={questionnaires} />
    </div>
  );
}
