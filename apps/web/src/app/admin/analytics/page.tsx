import { CompletionChart } from "@/components/charts/CompletionChart";
import { DropOffChart } from "@/components/charts/DropOffChart";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [
    { data: profiles = [] },
    { data: tasks = [] },
    { data: progressRows = [] },
    { data: posts = [] },
    { data: reports = [] },
    { data: notifications = [] },
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("tasks").select("id,title,order").order("order"),
    supabase.from("user_progress").select("user_id,task_id,status"),
    supabase.from("community_posts").select("id,task_id,is_hidden"),
    supabase.from("community_reports").select("id,post_id"),
    supabase.from("notification_log").select("id,opened_at"),
  ]);
  const safeProfiles = profiles ?? [];
  const safeTasks = tasks ?? [];
  const safeProgressRows = progressRows ?? [];
  const safePosts = posts ?? [];
  const safeReports = reports ?? [];
  const safeNotifications = notifications ?? [];

  const activeUserCount = safeProfiles.length;
  const completedByUser = safeProgressRows.reduce<Record<string, number>>((counts, row) => {
    if (row.status === "completed") {
      counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
    }

    return counts;
  }, {});
  const completedJourneyUsers = Object.values(completedByUser).filter(
    (count) => count >= 30,
  ).length;
  const completionRate =
    safeProfiles.length === 0
      ? 0
      : Math.round((completedJourneyUsers / safeProfiles.length) * 100);
  const dropOff = safeTasks.map((task) => ({
    completedUsers: new Set(
      safeProgressRows
        .filter((row) => row.task_id === task.id && row.status === "completed")
        .map((row) => row.user_id),
    ).size,
    order: task.order,
    title: task.title,
  }));
  const postCounts = safePosts.reduce<Record<string, number>>((counts, post) => {
    counts[post.task_id] = (counts[post.task_id] ?? 0) + 1;

    return counts;
  }, {});
  const popularThreads = safeTasks
    .map((task) => ({
      order: task.order,
      posts: postCounts[task.id] ?? 0,
      title: task.title,
    }))
    .sort((left, right) => right.posts - left.posts)
    .slice(0, 5);
  const notificationOpenRate =
    safeNotifications.length === 0
      ? 0
      : Math.round(
          (safeNotifications.filter((item) => item.opened_at !== null).length /
            safeNotifications.length) *
            100,
        );

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
          Analytics
        </p>
        <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
          Retention and community health
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
          Track where users fall off, how many finish the full journey, and whether
          community + notification loops are helping or hurting engagement.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tracked users", value: activeUserCount },
          { label: "Completion rate", value: `${completionRate}%` },
          { label: "Reports in queue", value: safeReports.length },
          { label: "Notification open rate", value: `${notificationOpenRate}%` },
        ].map((stat) => (
          <article
            className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]"
            key={stat.label}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              {stat.label}
            </p>
            <p className="mt-4 text-4xl font-bold text-focuslab-primaryDark">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Drop-off by day
          </p>
          <h3 className="mt-2 text-2xl font-bold text-focuslab-primaryDark">
            Which tasks users actually finish
          </h3>
          <div className="mt-6">
            <DropOffChart data={dropOff} />
          </div>
        </article>

        <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Completion split
          </p>
          <h3 className="mt-2 text-2xl font-bold text-focuslab-primaryDark">
            Finishers vs everyone else
          </h3>
          <div className="mt-6">
            <CompletionChart
              completionRate={completionRate}
              inProgressRate={Math.max(0, 100 - completionRate)}
            />
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Popular threads
          </p>
          <div className="mt-4 space-y-4">
            {popularThreads.map((thread) => (
              <div
                className="rounded-2xl bg-focuslab-background px-4 py-4"
                key={thread.order}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Day {thread.order}
                </p>
                <p className="mt-1 text-lg font-semibold text-focuslab-primaryDark">
                  {thread.title}
                </p>
                <p className="mt-2 text-sm text-focuslab-secondary">
                  {thread.posts} post{thread.posts === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Moderation snapshot
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-focuslab-background px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Hidden posts
              </p>
              <p className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
                {safePosts.filter((post) => post.is_hidden).length}
              </p>
            </div>
            <div className="rounded-2xl bg-focuslab-background px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Reported posts
              </p>
              <p className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
                {safeReports.length}
              </p>
            </div>
            <div className="rounded-2xl bg-focuslab-background px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Total community posts
              </p>
              <p className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
                {safePosts.length}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
