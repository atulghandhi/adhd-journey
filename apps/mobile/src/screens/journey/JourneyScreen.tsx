import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { RefreshControl } from "react-native";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import { AppCard } from "../../components/ui/AppCard";
import { MarkdownBlock } from "../../components/MarkdownBlock";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { StreakBadge } from "../../components/StreakBadge";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { SkeletonCard } from "../../components/ui/Skeleton";
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
  const { errorNotification, successNotification } = useHaptics();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedReviewRating, setSelectedReviewRating] = useState<number | null>(null);
  const welcomeBack = useMemo(
    () => getWelcomeBackMessage(profile?.last_active_at),
    [profile?.last_active_at],
  );

  const handleCheckIn = async (input: CompletionCheckInInput) => {
    if (!state?.currentTask) {
      return;
    }

    try {
      await submitCompletionCheckIn({
        input,
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

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: 20, padding: 24 }}
        refreshControl={
          <RefreshControl onRefresh={() => void refetch()} refreshing={isRefetching} />
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
                    : "Loading today"}
            </Text>
          </View>
          <StreakBadge count={state?.streakCount ?? 0} />
        </View>

        {welcomeBack ? (
          <View className="rounded-[20px] bg-focuslab-border px-4 py-4 dark:bg-dark-surface">
            <Text className="text-sm font-medium leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
              {welcomeBack}
            </Text>
          </View>
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
              <MarkdownBlock content={state.currentTask.task.task_body} />
            </View>
            <View className="mt-4">
              <PrimaryButton onPress={() => setSheetVisible(true)}>
                I did it
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
          <AppCard>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Review a past task
            </Text>
            <Text className="mt-2 text-xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {state.reviewTask.task.title}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Due today. Give yourself a quick gut-check on how this one is holding up.
            </Text>
            <View className="mt-4 flex-row gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <PrimaryButton
                  key={rating}
                  onPress={() => setSelectedReviewRating(rating)}
                >
                  {rating}
                </PrimaryButton>
              ))}
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
