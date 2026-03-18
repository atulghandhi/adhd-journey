"use client";

import { useEffect, useMemo, useState } from "react";
import type { Database } from "@focuslab/shared";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type CommunityPostRow = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityReportRow = Database["public"]["Tables"]["community_reports"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ModerationItem = CommunityPostRow & {
  authorName: string;
  reportCount: number;
};

export default function AdminModerationPage() {
  const supabase = createSupabaseBrowserClient();
  const [posts, setPosts] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hidden" | "reported">("reported");
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadModeration = async () => {
    setLoading(true);
    const [{ data: postsData, error: postsError }, { data: reportsData, error: reportsError }] =
      await Promise.all([
        supabase.from("community_posts").select("*").order("created_at", { ascending: false }),
        supabase.from("community_reports").select("*"),
      ]);

    if (postsError || reportsError) {
      setStatus(postsError?.message ?? reportsError?.message ?? "Could not load moderation data.");
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((postsData ?? []).map((post) => post.user_id))];
    const { data: authorsData, error: authorsError } = userIds.length
      ? await supabase.from("profiles").select("id,name").in("id", userIds)
      : { data: [], error: null };

    if (authorsError) {
      setStatus(authorsError.message);
      setLoading(false);
      return;
    }

    const authorsById = new Map(
      ((authorsData ?? []) as Pick<ProfileRow, "id" | "name">[]).map((author) => [
        author.id,
        author.name,
      ]),
    );
    const reportCounts = ((reportsData ?? []) as CommunityReportRow[]).reduce<Record<string, number>>(
      (counts, report) => {
        counts[report.post_id] = (counts[report.post_id] ?? 0) + 1;

        return counts;
      },
      {},
    );

    setPosts(
      ((postsData ?? []) as CommunityPostRow[]).map((post) => ({
        ...post,
        authorName: authorsById.get(post.user_id) ?? "FocusLab user",
        reportCount: reportCounts[post.id] ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void loadModeration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPosts = useMemo(() => {
    switch (filter) {
      case "hidden":
        return posts.filter((post) => post.is_hidden);
      case "reported":
        return posts.filter((post) => post.reportCount > 0);
      default:
        return posts;
    }
  }, [filter, posts]);

  const handleToggleHidden = async (post: ModerationItem) => {
    setBusyId(post.id);
    const { error } = await supabase
      .from("community_posts")
      .update({ is_hidden: !post.is_hidden })
      .eq("id", post.id);

    if (error) {
      setStatus(error.message);
      setBusyId(null);
      return;
    }

    setStatus(post.is_hidden ? "Post restored." : "Post hidden.");
    setBusyId(null);
    await loadModeration();
  };

  const handleDelete = async (postId: string) => {
    setBusyId(postId);
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);

    if (error) {
      setStatus(error.message);
      setBusyId(null);
      return;
    }

    setStatus("Post deleted.");
    setBusyId(null);
    await loadModeration();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
          Moderation
        </p>
        <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
          Community queue
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
          Review reported posts first, then use hide/unhide or delete actions to keep
          discussion threads healthy.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {(["reported", "hidden", "all"] as const).map((option) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === option
                  ? "bg-focuslab-primary text-white"
                  : "border border-focuslab-border text-focuslab-secondary hover:bg-focuslab-background"
              }`}
              key={option}
              onClick={() => setFilter(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-focuslab-secondary">
          {status ?? `${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"} in this view.`}
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            Loading moderation queue...
          </div>
        ) : null}

        {!loading && filteredPosts.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            No posts match this filter right now.
          </div>
        ) : null}

        {filteredPosts.map((post) => (
          <article
            className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]"
            key={post.id}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
                  {post.authorName} • {new Date(post.created_at).toLocaleString()}
                </p>
                <h3 className="mt-2 text-xl font-bold text-focuslab-primaryDark">
                  Reports: {post.reportCount}
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-focuslab-secondary">
                  {post.body}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-focuslab-border px-4 py-2 text-sm font-semibold text-focuslab-secondary transition hover:bg-focuslab-background disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busyId === post.id}
                  onClick={() => {
                    void handleToggleHidden(post);
                  }}
                  type="button"
                >
                  {post.is_hidden ? "Unhide" : "Hide"}
                </button>
                <button
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busyId === post.id}
                  onClick={() => {
                    void handleDelete(post.id);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
