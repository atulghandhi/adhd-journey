"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

interface ResendConfirmationButtonProps {
  email?: string;
}

export function ResendConfirmationButton({
  email,
}: ResendConfirmationButtonProps) {
  const supabase = createSupabaseBrowserClient();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (!email) {
      setMessage("Add your email again if you need a new confirmation link.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
      options: {
        emailRedirectTo: "http://127.0.0.1:3000/auth/confirm",
      },
    });

    setIsSubmitting(false);
    setMessage(error ? error.message : "Confirmation email sent.");
  };

  return (
    <div className="space-y-3">
      <button
        className="rounded-2xl border border-focuslab-border px-4 py-3 font-semibold text-focuslab-secondary"
        disabled={isSubmitting}
        onClick={handleClick}
        type="button"
      >
        {isSubmitting ? "Sending..." : "Resend confirmation"}
      </button>
      {message ? <p className="text-sm text-focuslab-secondary">{message}</p> : null}
    </div>
  );
}
