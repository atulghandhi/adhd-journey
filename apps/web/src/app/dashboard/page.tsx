import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Signed in
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          {user.email
            ? `Authenticated as ${user.email}.`
            : "Your account is active and ready for the journey flow."}
        </p>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
