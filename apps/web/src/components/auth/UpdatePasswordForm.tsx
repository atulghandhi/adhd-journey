"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        type="password"
        value={password}
      />
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        type="password"
        value={confirmPassword}
      />
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      <button
        className="w-full rounded-2xl bg-focuslab-primary px-4 py-3 font-semibold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating..." : "Set new password"}
      </button>
    </form>
  );
}
