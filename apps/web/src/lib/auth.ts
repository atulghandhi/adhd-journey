import { redirect } from "next/navigation";
import type { ProfileRow } from "@focuslab/shared";

import { createSupabaseServerClient } from "./supabase-server";

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getOptionalUser();

  if (!user) {
    return {
      profile: null,
      supabase,
      user: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  return {
    profile: profile ?? null,
    supabase,
    user,
  };
}

export async function requireUser() {
  const { supabase, user } = await getOptionalUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}

export async function requireAdmin() {
  const { profile, supabase, user } = await getCurrentProfile();

  if (!user) {
    redirect("/auth/login");
  }

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    profile,
    supabase,
    user,
  };
}
