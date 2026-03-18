import Link from "next/link";
import { buildJourneyState, DEFAULT_JOURNEY_ID } from "@focuslab/shared";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireUser();
  const { profile, supabase } = await getCurrentProfile();
  const [
    { data: tasks = [] },
    { data: progressRows = [] },
    { data: checkIns = [] },
    { data: reviewStates = [] },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("journey_id", DEFAULT_JOURNEY_ID)
      .eq("is_active", true)
      .order("order"),
    profile
      ? supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id)
      : Promise.resolve({ data: [], error: null }),
    profile
      ? supabase
          .from("check_ins")
          .select("*")
          .eq("user_id", profile.id)
          .order("checked_in_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    profile
      ? supabase
          .from("spaced_repetition_state")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const safeTasks = tasks ?? [];
  const safeProgressRows = progressRows ?? [];
  const safeCheckIns = checkIns ?? [];
  const safeReviewStates = reviewStates ?? [];
  const journeyState = profile
    ? buildJourneyState({
        checkIns: safeCheckIns,
        paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
        profile,
        progressRows: safeProgressRows,
        reviewStates: safeReviewStates,
        tasks: safeTasks,
      }).state
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-focuslab-background to-white px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-focuslab-secondary">
                Dashboard
              </p>
              <h1 className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
                {profile?.name ? `Welcome back, ${profile.name}` : "Your FocusLab dashboard"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-focuslab-secondary">
                {user.email
                  ? `Authenticated as ${user.email}.`
                  : "Your account is active and ready for the journey flow."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile?.role === "admin" ? (
                <Link
                  className="rounded-full border border-focuslab-primary px-4 py-2 text-sm font-semibold text-focuslab-primary transition hover:bg-focuslab-background"
                  href="/admin"
                >
                  Open admin CMS
                </Link>
              ) : null}
              <SignOutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Completed tasks",
              value: journeyState?.completedCount ?? 0,
            },
            {
              label: "Current streak",
              value: journeyState?.streakCount ?? 0,
            },
            {
              label: "Current day",
              value: journeyState?.currentTask?.task.order ?? "Finished",
            },
            {
              label: "Payment tier",
              value: profile?.payment_status === "paid" ? "Paid" : "Free",
            },
          ].map((card) => (
            <article
              className="rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(27,67,50,0.08)]"
              key={card.label}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                {card.label}
              </p>
              <p className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Journey snapshot
            </p>
            <h2 className="mt-3 text-2xl font-bold text-focuslab-primaryDark">
              {journeyState?.currentTask?.task.title ?? "You’ve reached the end of the journey"}
            </h2>
            <p className="mt-4 text-base leading-7 text-focuslab-secondary">
              {journeyState?.currentTask?.task.task_body ??
                "Your current task will appear here after the first check-in."}
            </p>
            {journeyState?.reviewTask ? (
              <div className="mt-6 rounded-[24px] bg-focuslab-background p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Next review
                </p>
                <p className="mt-2 text-lg font-semibold text-focuslab-primaryDark">
                  {journeyState.reviewTask.task.title}
                </p>
                <p className="mt-2 text-sm text-focuslab-secondary">
                  Due {journeyState.reviewTask.dueDate}
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-[28px] bg-white p-8 shadow-[0_24px_80px_rgba(27,67,50,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Recent check-ins
            </p>
            <div className="mt-4 space-y-4">
              {safeCheckIns.length === 0 ? (
                <p className="text-base leading-7 text-focuslab-secondary">
                  No check-ins yet. Open the mobile app to complete Day 1 and this view
                  will start filling out.
                </p>
              ) : (
                safeCheckIns.map((checkIn) => (
                  <div
                    className="rounded-[24px] bg-focuslab-background px-4 py-4"
                    key={checkIn.id}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                      {new Date(checkIn.checked_in_at).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-base font-semibold text-focuslab-primaryDark">
                      Rating {checkIn.quick_rating} • {checkIn.type.replace("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-focuslab-secondary">
                      Task {checkIn.task_id}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
