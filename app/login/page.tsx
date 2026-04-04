import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profile?.is_active) {
      redirect("/admin");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginForm />
    </main>
  );
}