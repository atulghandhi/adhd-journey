import type { Session } from "@supabase/supabase-js";

export function getMobileEntryRoute(session: Session | null) {
  return session ? "/journey" : "/auth/login";
}

export function getProtectedMobileRedirect(session: Session | null) {
  return session ? null : "/auth/login";
}
