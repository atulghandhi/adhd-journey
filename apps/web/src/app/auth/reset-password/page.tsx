import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Reset Password
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Choose a new password
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          Enter your new password below. You&apos;ll be signed in automatically
          once it&apos;s updated.
        </p>
        <div className="mt-8">
          <UpdatePasswordForm />
        </div>
      </div>
    </main>
  );
}
