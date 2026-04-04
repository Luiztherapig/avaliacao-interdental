import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type AdminProfile = {
  id: string;
  auth_user_id: string;
  unit_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
};

export async function requireAdmin(): Promise<{
  user: Awaited<
    ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>
  >["data"]["user"];
  profile: AdminProfile;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, auth_user_id, unit_id, email, full_name, role, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle<AdminProfile>();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login");
  }

  return {
    user,
    profile
  };
}