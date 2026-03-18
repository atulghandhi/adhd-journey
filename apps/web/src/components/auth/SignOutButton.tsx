"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      className="rounded-2xl border border-focuslab-border px-4 py-3 font-semibold text-focuslab-secondary"
      onClick={handleSignOut}
      type="button"
    >
      Sign out
    </button>
  );
}
