import { useEffect, useMemo, useState } from "react";
import type {
  Database,
} from "@focuslab/shared/types";

import { AppCard } from "../../components/ui/AppCard";
import { ReactionPill } from "../../components/ReactionPill";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAuth } from "../../hooks/useAuth";
import { useCommunityActions, useCommunityThread } from "../../hooks/useCommunity";
import { useHaptics } from "../../hooks/useHaptics";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useToast } from "../../providers/ToastProvider";

const reactionOptions = ["👎", "👍", "🔥", "❤️", "😮"] as const;
type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityReaction =
  Database["public"]["Tables"]["community_reactions"]["Row"];
type CommunityReplyRow = Database["public"]["Tables"]["community_replies"]["Row"];
type CommunityReply = CommunityReplyRow & { authorName: string };
type ThreadPost = CommunityPost & {
  authorName: string;
  reactions: CommunityReaction[];
  replies: CommunityReply[];
};

export function CommunityScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { lightImpact, selectionChanged, successNotification } = useHaptics();
  const { data: journeyState } = useJourneyState();
  const unlockedTasks = useMemo(
    () => (journeyState?.tasks ?? []).filter((task) => !task.isLocked),
    [journeyState?.tasks],
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const { data: thread, isLoading, error: threadError, refetch: refetchThread } = useCommunityThread(selectedTaskId);
  const actions = useCommunityActions(selectedTaskId);

  useEffect(() => {
    if (!selectedTaskId && unlockedTasks[0]) {
      setSelectedTaskId(unlockedTasks[0].task.id);
    }
  }, [selectedTaskId, unlockedTasks]);

  const handleCreatePost = async () => {
    if (draft.trim().length === 0) {
      return;
    }

    try {
      await actions.createPost.mutateAsync(draft.trim());
      setDraft("");
      successNotification();
      showToast("Post shared.");
    } catch {
      showToast("Couldn’t post right now.", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Community
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            One thread per task.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {unlockedTasks.map((task) => {
              const selected = task.task.id === selectedTaskId;

              return (
                <Pressable
                  className={`min-h-10 items-center justify-center rounded-full px-4 py-2 ${
                    selected
                      ? "bg-focuslab-primary"
                      : "border border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-card"
                  }`}
                  key={task.task.id}
                  onPress={() => setSelectedTaskId(task.task.id)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected
                        ? "text-white"
                        : "text-focuslab-secondary dark:text-dark-text-secondary"
                    }`}
                  >
                    Day {task.task.order}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Start the thread
          </Text>
          <TextInput
            className="mt-4 min-h-28 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-4 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
            multiline
            onChangeText={setDraft}
            placeholder="Share a win, a challenge, or a tip that helped."
            textAlignVertical="top"
            value={draft}
          />
          <View className="mt-4">
            <PrimaryButton
              loading={actions.createPost.isPending}
              onPress={() => {
                void handleCreatePost();
              }}
            >
              Write a post
            </PrimaryButton>
          </View>
        </AppCard>

      {isLoading ? (
        <AppCard>
          <Text className="text-base text-focuslab-secondary dark:text-dark-text-secondary">Loading thread…</Text>
        </AppCard>
      ) : null}

        {threadError ? (
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              Couldn&apos;t load this thread
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Something went wrong talking to the server. Your other data is safe.
            </Text>
            <View className="mt-4">
              <PrimaryButton onPress={() => void refetchThread()}>Try again</PrimaryButton>
            </View>
          </AppCard>
        ) : null}

        {!isLoading && !threadError && (!thread || thread.length === 0) ? (
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              No posts yet
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Be the first to share how this task is going for you.
            </Text>
          </AppCard>
        ) : null}

        {(thread as ThreadPost[] | undefined ?? []).map((post) => (
          <AppCard key={post.id}>
            <Text className="text-sm font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
              {post.authorName}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-primaryDark dark:text-dark-text-primary">
              {post.body}
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {reactionOptions.map((emoji) => {
                const count = post.reactions.filter(
                  (reaction: CommunityReaction) => reaction.emoji === emoji,
                ).length;
                const active = post.reactions.some(
                  (reaction: CommunityReaction) =>
                    reaction.emoji === emoji && reaction.user_id === user?.id,
                );

                return (
                  <ReactionPill
                    active={active}
                    count={count}
                    emoji={emoji}
                    key={`${post.id}-${emoji}`}
                    onPress={() => {
                      selectionChanged();
                      void actions.toggleReaction
                        .mutateAsync({
                          emoji,
                          postId: post.id,
                          reacted: active,
                        })
                        .catch(() => showToast("Couldn’t update that reaction.", "error"));
                    }}
                  />
                );
              })}
            </View>

            <View className="mt-4 gap-3">
              {(post.replies ?? []).map((reply: CommunityReply) => (
                <View
                  className="rounded-2xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg"
                  key={reply.id}
                >
                  <Text className="mb-1 text-xs font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
                    {reply.authorName}
                  </Text>
                  <Text className="text-sm leading-6 text-focuslab-primaryDark dark:text-dark-text-primary">
                    {reply.body}
                  </Text>
                </View>
              ))}
            </View>

            <TextInput
              className="mt-4 min-h-12 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
              onChangeText={(value: string) =>
                setReplyDrafts((current) => ({
                  ...current,
                  [post.id]: value,
                }))
              }
              placeholder="Add a reply"
              value={replyDrafts[post.id] ?? ""}
            />
            <View className="mt-3 flex-row gap-3">
              <PrimaryButton
                loading={actions.createReply.isPending}
                onPress={() => {
                  void actions.createReply
                    .mutateAsync({
                      body: replyDrafts[post.id] ?? "",
                      postId: post.id,
                    })
                    .then(() => {
                      lightImpact();
                      setReplyDrafts((current) => ({
                        ...current,
                        [post.id]: "",
                      }));
                    })
                    .catch(() => showToast("Couldn’t reply just yet.", "error"));
                }}
              >
                Reply
              </PrimaryButton>
              <Pressable
                className="items-center justify-center rounded-2xl px-4 py-3"
                disabled={actions.reportPost.isPending}
                onPress={() => {
                  void actions.reportPost
                    .mutateAsync({
                      postId: post.id,
                      reason: "Reported from mobile thread",
                    })
                    .then(() => showToast("Post reported."))
                    .catch(() => showToast("Couldn’t report this post.", "error"));
                }}
              >
                <Text className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  {actions.reportPost.isPending ? "Reporting…" : "Report"}
                </Text>
              </Pressable>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
