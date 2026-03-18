import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "./supabase-server";

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getOptionalUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}
