"use client";

import { useState } from "react";

import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export function ForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${getSiteUrl()}/auth/reset-password`,
    });

    setIsSubmitting(false);
    setMessage(
      error ? error.message : "If the email exists, a reset message is on the way.",
    );
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        value={email}
      />
      {message ? <p className="text-sm text-focuslab-secondary">{message}</p> : null}
      <button
        className="w-full rounded-2xl bg-focuslab-primary px-4 py-3 font-semibold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send reset email"}
      </button>
    </form>
  );
}
