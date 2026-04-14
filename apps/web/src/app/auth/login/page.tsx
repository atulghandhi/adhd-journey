import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Login
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Welcome back
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          Sign in to keep your Next Thing journey synced.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-focuslab-secondary">
          <Link href="/auth/register">Create account</Link>
          <Link href="/auth/forgot-password">Forgot password</Link>
        </div>
      </div>
    </main>
  );
}
