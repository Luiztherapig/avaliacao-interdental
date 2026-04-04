import { DashboardView } from "@/components/admin/dashboard-view";
import { getDashboardData } from "@/lib/queries/admin";

export default async function AdminDashboardPage() {
  const data = await getDashboardData("34249606-e36d-4328-b899-5233c0329d17");

  return <DashboardView data={data} />;
}