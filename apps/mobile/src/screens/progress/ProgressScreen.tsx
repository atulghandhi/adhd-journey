import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ScrollView as RNScrollView } from "react-native";

import { AppCard } from "../../components/ui/AppCard";
import { JourneyMap } from "../../components/JourneyMap";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useJourneyState } from "../../hooks/useJourneyState";

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
        .limit(20);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    queryKey: ["check-ins", user?.id],
  });

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
        contentContainerStyle={{ gap: 20, padding: 24 }}
        ref={scrollRef}
      >
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Progress
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your journey map
          </Text>
        </View>

        {state ? (
          <AppCard>
            <JourneyMap
              justUnlockedTaskIds={justUnlockedTaskIds}
              onVisibleActiveNode={(y) => {
                scrollRef.current?.scrollTo({
                  animated: true,
                  y: Math.max(0, y - 140),
                });
              }}
              state={state}
            />
          </AppCard>
        ) : null}

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your journey
          </Text>
          <View className="mt-4 gap-3">
            {(checkIns ?? []).map((checkIn) => (
              <View
                className="rounded-2xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg"
                key={checkIn.id}
              >
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  {new Date(checkIn.checked_in_at).toLocaleDateString()}
                </Text>
                <Text className="mt-2 text-base text-focuslab-primaryDark dark:text-dark-text-primary">
                  Rating {checkIn.quick_rating} · {checkIn.type.replace("_", " ")}
                </Text>
              </View>
            ))}
            {!checkIns || checkIns.length === 0 ? (
              <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                Complete your first check-in to see your journey here.
              </Text>
            ) : null}
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
