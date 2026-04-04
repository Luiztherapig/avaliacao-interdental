import { DentistsManager } from "@/components/admin/dentists-manager";
import { getDentists } from "@/lib/queries/admin";

export default async function DentistsPage() {
  const dentists = await getDentists("34249606-e36d-4328-b899-5233c0329d17");

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          Cadastros
        </p>
        <h1 className="mt-2 text-3xl">Dentistas</h1>
      </div>
      <DentistsManager initialDentists={dentists} />
    </div>
  );
}