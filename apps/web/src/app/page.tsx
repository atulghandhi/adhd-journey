import { appMetadata, sharedPlaceholder } from "@focuslab/shared";

const featurePills = [
  "Expo mobile app",
  "Next.js admin dashboard",
  "Shared TypeScript package",
  "Supabase backend",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-focuslab-background to-white px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
          <div className="mb-6 flex flex-wrap gap-3 text-sm font-semibold text-focuslab-secondary">
            <a href="/auth/login">Login</a>
            <a href="/auth/register">Register</a>
            <a href="/dashboard">Dashboard</a>
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
            FocusLab
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.03em] text-focuslab-primaryDark md:text-6xl">
            {appMetadata.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-focuslab-secondary">
            Milestone 01 establishes the monorepo foundation for the Expo mobile app,
            Next.js dashboard, and shared business logic package.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-focuslab-border bg-focuslab-background px-4 py-2 text-sm font-medium text-focuslab-secondary"
              >
                {pill}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[28px] bg-focuslab-primaryDark p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Shared Package Check
            </p>
            <p className="mt-4 text-2xl font-semibold">{sharedPlaceholder}</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
              Both apps import from the workspace package, which gives us a single place
              for shared types, algorithms, and domain contracts.
            </p>
          </article>

          <article className="rounded-[28px] border border-focuslab-border bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
              Next Steps
            </p>
            <ul className="mt-4 space-y-3 text-base leading-7 text-focuslab-secondary">
              <li>Database migrations and seed data</li>
              <li>Supabase auth flows on mobile and web</li>
              <li>Journey engine and check-in system</li>
              <li>Testing, notifications, and admin tooling</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
