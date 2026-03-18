import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Register
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Create your account
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          Start with email and password, then confirm your inbox to continue.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
        <div className="mt-6 text-sm text-focuslab-secondary">
          <Link href="/auth/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </main>
  );
}
