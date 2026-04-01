import { DashboardView } from "@/components/admin/dashboard-view";
import { getDashboardData } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminDashboardPage() {
  const { profile } = await requireAdmin();
  const data = await getDashboardData(profile.unit_id);

  return <DashboardView data={data} />;
}