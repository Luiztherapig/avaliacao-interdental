import { SubmissionsTable } from "@/components/admin/submissions-table";
import { getSubmissions } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminSubmissionsPage() {
  const { profile } = await requireAdmin();
  const submissions = await getSubmissions(profile.unit_id);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Operação</p>
        <h1 className="mt-2 text-3xl">Avaliações</h1>
      </div>
      <SubmissionsTable submissions={submissions} />
    </div>
  );
}
