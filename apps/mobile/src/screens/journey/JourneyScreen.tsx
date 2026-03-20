import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { RefreshControl } from "react-native";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import { EmojiRating } from "../../components/EmojiRating";
import { AppCard } from "../../components/ui/AppCard";
import { MarkdownBlock } from "../../components/MarkdownBlock";
import { ProgressRing } from "../../components/ProgressRing";
import { TaskRenderer } from "../../components/TaskRenderer";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { StreakBadge } from "../../components/StreakBadge";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { getDailyMotivation } from "../../constants/motivation";
import { useCheckIn } from "../../hooks/useCheckIn";
import { useHaptics } from "../../hooks/useHaptics";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useProfile } from "../../hooks/useProfile";
import { useToast } from "../../providers/ToastProvider";
import { CheckInSheet } from "./CheckInSheet";
import type { CompletionCheckInInput } from "@focuslab/shared";

function getWelcomeBackMessage(lastActiveAt: string | null | undefined) {
  if (!lastActiveAt) {
    return null;
  }

  const hoursSinceLastActive =
    (Date.now() - new Date(lastActiveAt).getTime()) / 3_600_000;

  if (hoursSinceLastActive >= 48) {
    return "Hey — starting again is the hardest part, and you just did it. Let's go.";
  }

  if (hoursSinceLastActive >= 24) {
    return "Welcome back! Ready to pick up where you left off?";
  }

  return null;
}

export function JourneyScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: profile } = useProfile();
  const { data: state, isLoading, refetch, isRefetching } = useJourneyState();
  const { submitCompletionCheckIn, submitReviewCheckIn, submittingCompletion } =
    useCheckIn();
  const { errorNotification, lightImpact, successNotification } = useHaptics();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedReviewRating, setSelectedReviewRating] = useState<number | null>(null);
  const [taskInteractionComplete, setTaskInteractionComplete] = useState(false);
  const [taskInteractionData, setTaskInteractionData] = useState<
    Record<string, unknown> | undefined
  >();
  const isDoneForToday = Boolean(
    state &&
      !state.currentTask &&
      state.nextUnlockDate &&
      !state.showPaywall &&
      !state.isPostCompletion,
  );
  const welcomeBack = useMemo(
    () => getWelcomeBackMessage(profile?.last_active_at),
    [profile?.last_active_at],
  );
  const doneForTodayTitle = useMemo(() => {
    const streak = state?.streakCount ?? 0;

    if (streak >= 7) {
      return "On fire";
    }

    if (streak >= 3) {
      return "Building momentum";
    }

    return "Done for today";
  }, [state?.streakCount]);
  const dailyMotivation = getDailyMotivation();
  const doneForTodayState = isDoneForToday ? state : null;

  useEffect(() => {
    setTaskInteractionComplete(false);
    setTaskInteractionData(undefined);
  }, [state?.currentTask?.task.id]);

  useEffect(() => {
    setSelectedReviewRating(null);
  }, [state?.reviewTask?.task.id]);

  const handleCheckIn = async (input: CompletionCheckInInput) => {
    if (!state?.currentTask) {
      return;
    }

    try {
      await submitCompletionCheckIn({
        input: {
          ...input,
          promptResponses: {
            ...(input.promptResponses ?? {}),
            interaction_data: taskInteractionData
              ? JSON.stringify(taskInteractionData)
              : undefined,
          },
        },
        taskId: state.currentTask.task.id,
      });
      successNotification();
      showToast("Check-in saved.");
    } catch {
      errorNotification();
      showToast(
        "Couldn't save your check-in right away — we'll try again when you're back online.",
        "error",
      );
    }
  };

  const handleReviewSubmit = async () => {
    if (!state?.reviewTask || !selectedReviewRating) {
      return;
    }

    try {
      await submitReviewCheckIn({
        quickRating: selectedReviewRating,
        taskId: state.reviewTask.task.id,
      });
      setSelectedReviewRating(null);
      successNotification();
      showToast("Review saved.");
    } catch {
      errorNotification();
      showToast("Couldn't save that review just yet.", "error");
    }
  };

  const handleRefresh = async () => {
    await refetch();
    lightImpact();
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: 20, padding: 24 }}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void handleRefresh();
            }}
            refreshing={isRefetching}
          />
        }
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Journey
            </Text>
            <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {state?.currentTask
                ? `Day ${state.currentTask.task.order}`
                : state?.showPaywall
                  ? "Keep going"
                  : state?.isPostCompletion
                    ? "You made it"
                    : isDoneForToday
                      ? doneForTodayTitle
                      : "Loading today"}
            </Text>
          </View>
          <StreakBadge count={state?.streakCount ?? 0} size="lg" />
        </View>

        {welcomeBack ? (
          <View className="rounded-[20px] bg-focuslab-border px-4 py-4 dark:bg-dark-surface">
            <Text className="text-sm font-medium leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
              {welcomeBack}
            </Text>
          </View>
        ) : null}

        {doneForTodayState ? (
          <>
            <AnimatedCardEntrance delay={0}>
              <AppCard>
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  {doneForTodayState.nextLockedTask
                    ? `Day ${doneForTodayState.nextLockedTask.task.order} unlocks tomorrow`
                    : "Your next task unlocks tomorrow"}
                </Text>
                <Text className="mt-2 text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
                  You&apos;re done for today.
                </Text>
                <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                  Your check-in is saved. Come back tomorrow for the next step in the
                  journey.
                </Text>
              </AppCard>
            </AnimatedCardEntrance>

            <AnimatedCardEntrance delay={100}>
              <AppCard>
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  Your progress
                </Text>
                <View className="mt-4 items-center">
                  <ProgressRing
                    completed={doneForTodayState.completedCount}
                    total={doneForTodayState.tasks.length}
                  />
                </View>
                <Text className="mt-4 text-center text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                  Day {doneForTodayState.completedCount} of {doneForTodayState.tasks.length} complete
                </Text>
              </AppCard>
            </AnimatedCardEntrance>

            <AnimatedCardEntrance delay={200}>
              <AppCard>
                <Text className="text-base italic leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                  &quot;{dailyMotivation}&quot;
                </Text>
              </AppCard>
            </AnimatedCardEntrance>
          </>
        ) : null}

        {state?.showPaywall ? (
          <AnimatedCardEntrance delay={100}>
          <AppCard>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Day 16 unlock
            </Text>
            <Text className="mt-3 text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              The next 15 days are ready when you are.
            </Text>
            <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              You said you wanted to: {profile?.motivating_answer ?? "build real focus"}.
            </Text>
            <View className="mt-6">
              <PrimaryButton onPress={() => router.push("/payment/paywall" as never)}>
                View paywall
              </PrimaryButton>
            </View>
          </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {state?.currentTask ? (
          <AnimatedCardEntrance delay={0}>
          <AppCard>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              {state.currentTask.subtitle ?? "Today's task"}
            </Text>
            <Text className="mt-2 text-[26px] font-bold leading-8 text-focuslab-primaryDark dark:text-dark-text-primary">
              {state.currentTask.task.title}
            </Text>
            <View className="mt-4">
              <TaskRenderer
                onCompletionChange={(complete, data) => {
                  setTaskInteractionComplete(complete);
                  setTaskInteractionData(data);
                }}
                task={state.currentTask.task}
              />
            </View>
            <View className="mt-4">
              <PrimaryButton
                disabled={!taskInteractionComplete}
                onPress={() => setSheetVisible(true)}
              >
                {taskInteractionComplete
                  ? "I did it"
                  : "Complete the task above first"}
              </PrimaryButton>
            </View>

            {state.currentTask.task.order === 17 ? (
              <View className="mt-4">
                <PrimaryButton
                  onPress={() => router.push("/journey/mindful-gateway" as never)}
                >
                  Open mindful gateway tutorial
                </PrimaryButton>
              </View>
            ) : null}
          </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {state?.currentTask ? (
          <AnimatedCardEntrance delay={150}>
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              Why this matters
            </Text>
            <View className="mt-3">
              <MarkdownBlock content={state.currentTask.task.explanation_body} />
            </View>
            {state.currentTask.task.deeper_reading ? (
              <View className="mt-4">
                <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                  Deeper reading
                </Text>
                <View className="mt-3">
                  <MarkdownBlock content={state.currentTask.task.deeper_reading} />
                </View>
              </View>
            ) : null}
          </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {state?.reviewTask ? (
          <AnimatedCardEntrance delay={doneForTodayState ? 300 : 250}>
              <AppCard>
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  Quick review
                </Text>
                <Text className="mt-2 text-xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
                  {state.reviewTask.task.title}
                </Text>
                <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                  How is this one holding up? Quick gut-check.
                </Text>
                <View className="mt-4">
                  <EmojiRating
                    onChange={setSelectedReviewRating}
                    value={selectedReviewRating}
                  />
                </View>
                <View className="mt-4">
                  <PrimaryButton
                    disabled={!selectedReviewRating}
                    onPress={() => {
                      void handleReviewSubmit();
                    }}
                  >
                    Save review
                  </PrimaryButton>
                </View>
              </AppCard>
            </AnimatedCardEntrance>
        ) : null}

        {doneForTodayState ? (
          <AnimatedCardEntrance delay={400}>
            <AppCard>
              <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                Keep the momentum
              </Text>
              <Text className="mt-2 text-xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
                Share how today went in the community.
              </Text>
              <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                Post a win, a struggle, or a tip while the task is still fresh.
              </Text>
              <View className="mt-6">
                <PrimaryButton onPress={() => router.push("/community" as never)}>
                  Open community
                </PrimaryButton>
              </View>
            </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {state?.isPostCompletion ? (
          <AnimatedCardEntrance>
          <AppCard>
            <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              Congratulations
            </Text>
            <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              You finished the 30-day journey. Your review cards will keep appearing,
              and you can revisit everything whenever you want.
            </Text>
            <View className="mt-6 gap-3">
              <PrimaryButton onPress={() => router.push("/completion/congrats" as never)}>
                Open completion summary
              </PrimaryButton>
              <PrimaryButton onPress={() => router.push("/completion/resources" as never)}>
                Browse resources
              </PrimaryButton>
            </View>
          </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}

        {!state && !isLoading ? (
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              We couldn&apos;t load your journey.
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Pull to refresh and we&apos;ll try again.
            </Text>
          </AppCard>
        ) : null}
      </ScrollView>

      <CheckInSheet
        loading={submittingCompletion}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleCheckIn}
        visible={sheetVisible}
      />
    </SafeAreaView>
  );
}
