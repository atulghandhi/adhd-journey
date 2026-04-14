import Link from "next/link";

import { appMetadata } from "@focuslab/shared";

const highlights = [
  "30 daily strategies backed by ADHD research",
  "Spaced repetition to make strategies stick",
  "Personal toolkit of what works for you",
  "Mindful gateway to break doom-scrolling",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-focuslab-background to-white px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
          <div className="mb-6 flex flex-wrap gap-3 text-sm font-semibold text-focuslab-secondary">
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register">Register</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
            Next Thing
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.03em] text-focuslab-primaryDark md:text-6xl">
            {appMetadata.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-focuslab-secondary">
            A 30-day guided journey to build real focus strategies that fit the
            way your ADHD brain actually works. One task per day. No fluff.
          </p>
          <div className="mt-8">
            <Link
              className="inline-block rounded-full bg-focuslab-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              href="/auth/register"
            >
              Get started free
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[28px] bg-focuslab-primaryDark p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              How it works
            </p>
            <p className="mt-4 text-2xl font-semibold">
              One strategy per day. Your pace.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
              Each day unlocks a practical strategy drawn from ADHD research.
              Complete a quick check-in to unlock the next one. Strategies you
              love stay in your personal toolkit and get resurfaced at the right
              intervals so they actually stick.
            </p>
          </article>

          <article className="rounded-[28px] border border-focuslab-border bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
              What you get
            </p>
            <ul className="mt-4 space-y-3 text-base leading-7 text-focuslab-secondary">
              {highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
