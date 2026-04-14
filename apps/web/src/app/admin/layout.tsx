import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/auth";

const adminLinks = [
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/settings", label: "SR Config" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireAdmin();

  return (
    <main className="min-h-screen bg-gradient-to-b from-focuslab-background to-white px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
                Admin CMS
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-focuslab-primaryDark">
                Next Thing control room
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
                Signed in as {profile?.name ?? "Admin"}. Manage the 30-day journey,
                notification copy, rewards, moderation, and retention analytics from
                one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full border border-focuslab-border px-4 py-2 text-sm font-semibold text-focuslab-secondary transition hover:bg-focuslab-background"
                href="/dashboard"
              >
                User dashboard
              </Link>
              <SignOutButton />
            </div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              className="rounded-full border border-focuslab-border bg-white px-4 py-2 text-sm font-semibold text-focuslab-secondary transition hover:border-focuslab-primary hover:text-focuslab-primary"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
