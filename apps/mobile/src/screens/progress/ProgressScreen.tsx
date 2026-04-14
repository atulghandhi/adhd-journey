import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ScrollView as RNScrollView } from "react-native";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import { AppCard } from "../../components/ui/AppCard";
import { JourneyMap } from "../../components/JourneyMap";
import { ProgressRing } from "../../components/ProgressRing";
import { StreakBadge } from "../../components/StreakBadge";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useJourneyState } from "../../hooks/useJourneyState";

const EMOJI_MAP: Record<number, string> = {
  1: "😫",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🤩",
};

function relativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function ProgressScreen() {
  const { user } = useAuth();
  const { data: state } = useJourneyState();
  const scrollRef = useRef<RNScrollView | null>(null);
  const previousTasksRef = useRef(state?.tasks ?? []);
  const [justUnlockedTaskIds, setJustUnlockedTaskIds] = useState<string[]>([]);
  const { data: checkIns } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .order("checked_in_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    queryKey: ["check-ins", user?.id],
  });

  const completedCount = useMemo(
    () => state?.tasks.filter((t) => t.isCompleted).length ?? 0,
    [state?.tasks],
  );

  const activeTask = useMemo(
    () => state?.tasks.find((t) => t.isActive),
    [state?.tasks],
  );

  useEffect(() => {
    if (!state?.tasks) {
      return;
    }

    const justUnlocked = state.tasks
      .filter((task) =>
        task.isActive &&
        previousTasksRef.current.find(
          (previousTask) =>
            previousTask.task.id === task.task.id && previousTask.isLocked,
        ),
      )
      .map((task) => task.task.id);

    if (justUnlocked.length > 0) {
      setJustUnlockedTaskIds(justUnlocked);
      const clearTimer = setTimeout(() => setJustUnlockedTaskIds([]), 1200);

      previousTasksRef.current = state.tasks;

      return () => clearTimeout(clearTimer);
    }

    previousTasksRef.current = state.tasks;
  }, [state?.tasks]);

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ gap: 20, padding: 24, paddingBottom: 40 }}
        ref={scrollRef}
      >
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Progress
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your journey
          </Text>
        </View>

        {state ? (
          <AnimatedCardEntrance delay={0}>
            <AppCard>
              <View className="flex-row items-center gap-5">
                <ProgressRing
                  completed={completedCount}
                  size={100}
                  strokeWidth={8}
                  total={state.tasks.length}
                />
                <View className="flex-1 gap-3">
                  <StreakBadge count={state.streakCount} size="lg" />
                  {activeTask ? (
                    <View className="rounded-xl bg-focuslab-background px-3 py-2 dark:bg-dark-bg">
                      <Text className="text-xs font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                        Up next
                      </Text>
                      <Text
                        className="mt-0.5 text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary"
                        numberOfLines={1}
                      >
                        Day {activeTask.task.order} — {activeTask.task.title}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-semibold text-focuslab-primary">
                      Journey complete! 🎉
                    </Text>
                  )}
                </View>
              </View>
            </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        {state ? (
          <AnimatedCardEntrance delay={100}>
            <AppCard>
              <Text className="mb-4 text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Journey map
              </Text>
              <JourneyMap
                justUnlockedTaskIds={justUnlockedTaskIds}
                onVisibleActiveNode={(y) => {
                  scrollRef.current?.scrollTo({
                    animated: true,
                    y: Math.max(0, y + 180),
                  });
                }}
                state={state}
              />
            </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        <AnimatedCardEntrance delay={200}>
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              Recent activity
            </Text>
            <View className="mt-4 gap-0">
              {(checkIns ?? []).map((checkIn, index) => (
                <View
                  className={`flex-row items-start gap-3 py-3 ${
                    index < (checkIns?.length ?? 0) - 1
                      ? "border-b border-focuslab-border dark:border-dark-border"
                      : ""
                  }`}
                  key={checkIn.id}
                >
                  <Text className="mt-0.5 text-xl">
                    {EMOJI_MAP[checkIn.quick_rating] ?? "😐"}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                      {checkIn.type.replace("_", " ")}
                    </Text>
                    <Text className="mt-0.5 text-xs text-focuslab-secondary dark:text-dark-text-secondary">
                      {relativeDate(checkIn.checked_in_at)}
                    </Text>
                  </View>
                </View>
              ))}
              {!checkIns || checkIns.length === 0 ? (
                <Text className="py-4 text-center text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                  Complete your first check-in to see your activity here.
                </Text>
              ) : null}
            </View>
          </AppCard>
        </AnimatedCardEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}
