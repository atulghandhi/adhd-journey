"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
        // Temporary testing bypass while Supabase email confirmation is disabled.
        // emailRedirectTo: "http://127.0.0.1:3000/auth/confirm",
      },
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // Temporary testing bypass while Supabase email confirmation is disabled.
    // router.push(`/auth/confirm?email=${encodeURIComponent(email.trim())}`);

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        value={name}
      />
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        value={email}
      />
      <input
        className="w-full rounded-2xl border border-focuslab-border px-4 py-3"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        value={password}
      />
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      <button
        className="w-full rounded-2xl bg-focuslab-primary px-4 py-3 font-semibold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
