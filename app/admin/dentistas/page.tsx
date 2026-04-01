import { DentistsManager } from "@/components/admin/dentists-manager";
import { getDentists } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function DentistsPage() {
  const { profile } = await requireAdmin();
  const dentists = await getDentists(profile.unit_id);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Cadastros</p>
        <h1 className="mt-2 text-3xl">Dentistas</h1>
      </div>
      <DentistsManager initialDentists={dentists} />
    </div>
  );
}
