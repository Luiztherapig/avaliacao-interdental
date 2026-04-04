import { QuestionnairesManager } from "@/components/admin/questionnaires-manager";
import { getQuestionnaires } from "@/lib/queries/admin";

export default async function QuestionsPage() {
  const questionnaires = await getQuestionnaires("34249606-e36d-4328-b899-5233c0329d17");

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          Questionário
        </p>
        <h1 className="mt-2 text-3xl">Perguntas</h1>
      </div>
      <QuestionnairesManager initialData={questionnaires} />
    </div>
  );
}