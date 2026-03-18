import { ResendConfirmationButton } from "@/components/auth/ResendConfirmationButton";

interface ConfirmPageProps {
  searchParams?: Promise<{
    email?: string;
  }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const resolvedParams = (await searchParams) ?? {};

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
          Confirm Email
        </p>
        <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
          Check your email
        </h1>
        <p className="mt-4 text-base leading-7 text-focuslab-secondary">
          {resolvedParams.email
            ? `We sent a confirmation link to ${resolvedParams.email}.`
            : "Open the confirmation message we just sent you and follow the link."}
        </p>
        <div className="mt-8">
          <ResendConfirmationButton email={resolvedParams.email} />
        </div>
      </div>
    </main>
  );
}
