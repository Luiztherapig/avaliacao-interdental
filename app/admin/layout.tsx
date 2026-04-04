import { AdminSidebar } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/admin/logout-button";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="grid gap-6">
          <div className="panel-shell flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-slate-500">Administrador</p>
              <p className="font-semibold">Administrador Interdental</p>
            </div>
            <LogoutButton />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
