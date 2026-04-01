import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function SettingsPage() {
  const { profile } = await requireAdmin();
  const settings = await getSettings(profile.unit_id);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Sistema</p>
        <h1 className="mt-2 text-3xl">Configurações</h1>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
