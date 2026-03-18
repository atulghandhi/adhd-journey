import type { ProfileRow } from "@focuslab/shared";

import { supabase } from "./supabase";

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<ProfileRow>();

  if (error || !data) {
    throw error ?? new Error("Profile not found.");
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<ProfileRow>,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single<ProfileRow>();

  if (error || !data) {
    throw error ?? new Error("Profile could not be updated.");
  }

  return data;
}
