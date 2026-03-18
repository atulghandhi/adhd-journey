import { createClient } from "npm:@supabase/supabase-js@2.90.0";

import type { Database } from "../../../packages/shared/src/types/database.ts";
import { HttpError } from "./http.ts";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ??
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ??
  "http://127.0.0.1:54321";

const supabaseAnonKey =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ??
  "";

const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";

function assertKey(value: string, label: string) {
  if (value.length === 0) {
    throw new HttpError(500, `${label} is not configured for Edge Functions.`);
  }

  return value;
}

export function createUserClient(authorization: string) {
  return createClient<Database>(
    supabaseUrl,
    assertKey(supabaseAnonKey, "SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  );
}

export function createServiceClient() {
  return createClient<Database>(
    supabaseUrl,
    assertKey(serviceRoleKey || supabaseAnonKey, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
