import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Password Reset
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Reset your password
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          Enter your email address and we’ll send a reset link if the account exists.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
