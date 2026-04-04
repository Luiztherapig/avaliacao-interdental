import { SubmissionsTable } from "@/components/admin/submissions-table";
import { getSubmissions } from "@/lib/queries/admin";

export default async function AdminSubmissionsPage() {
  const submissions = await getSubmissions("34249606-e36d-4328-b899-5233c0329d17");

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          Operação
        </p>
        <h1 className="mt-2 text-3xl">Avaliações</h1>
      </div>
      <SubmissionsTable submissions={submissions} />
    </div>
  );
}