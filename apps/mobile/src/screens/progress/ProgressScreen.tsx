import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Map as MapIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import type { ScrollView as RNScrollView } from "react-native";

import type { JourneyTaskState, ToolkitItem, ToolkitStatus } from "@focuslab/shared";

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
import { useHaptics } from "../../hooks/useHaptics";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useToolkit } from "../../hooks/useToolkit";
import { useToast } from "../../providers/ToastProvider";
import { AppDisruptCard } from "../gateway/AppDisruptCard";

const EMOJI_MAP: Record<number, string> = {
  1: "😫",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🤩",
};

const STATUS_OPTIONS: { label: string; status: ToolkitStatus }[] = [
  { label: "Keep", status: "keep" },
  { label: "Maybe", status: "maybe_later" },
  { label: "Dismiss", status: "not_for_me" },
];

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

interface ToolkitCardProps {
  item: ToolkitItem;
  muted?: boolean;
  onStatusChange: (taskId: string, status: ToolkitStatus) => void;
  taskState: JourneyTaskState | undefined;
}

function ToolkitCard({ item, muted, onStatusChange, taskState }: ToolkitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const chevronColor = isDark ? "#A5D6A7" : "#2D6A4F";

  if (!taskState) {
    return null;
  }

  return (
    <View
      className={`rounded-2xl border px-4 py-3 ${
        muted
          ? "border-focuslab-border/50 bg-focuslab-background/50 dark:border-dark-border/50 dark:bg-dark-bg/50"
          : "border-focuslab-border bg-focuslab-background dark:border-dark-border dark:bg-dark-bg"
      }`}
    >
      <Pressable
        className="flex-row items-center gap-3"
        onPress={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown color={chevronColor} size={16} />
        ) : (
          <ChevronRight color={chevronColor} size={16} />
        )}
        <View className="flex-1">
          <Text
            className={`text-xs font-medium ${
              muted
                ? "text-focuslab-border dark:text-dark-border"
                : "text-focuslab-secondary dark:text-dark-text-secondary"
            }`}
          >
            Day {taskState.task.order}
          </Text>
          <Text
            className={`text-sm font-semibold ${
              muted
                ? "text-focuslab-secondary/60 dark:text-dark-text-secondary/60"
                : "text-focuslab-primaryDark dark:text-dark-text-primary"
            }`}
            numberOfLines={expanded ? undefined : 1}
          >
            {taskState.task.title}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View className="mt-3 gap-2 border-t border-focuslab-border pt-3 dark:border-dark-border">
          <Text className="text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary" numberOfLines={3}>
            {taskState.task.task_body.slice(0, 200)}…
          </Text>
          <View className="mt-1 flex-row gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                className={`rounded-full px-3 py-1.5 ${
                  item.status === opt.status
                    ? "bg-focuslab-primary"
                    : "bg-focuslab-border dark:bg-dark-border"
                }`}
                key={opt.status}
                onPress={() => onStatusChange(item.task_id, opt.status)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    item.status === opt.status
                      ? "text-white"
                      : "text-focuslab-secondary dark:text-dark-text-secondary"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface CollapsibleSectionProps {
  children: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  title: string;
}

function CollapsibleSection({ children, count, defaultOpen = false, title }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const chevronColor = isDark ? "#A5D6A7" : "#2D6A4F";

  if (count === 0) {
    return null;
  }

  return (
    <View>
      <Pressable
        className="flex-row items-center justify-between py-2"
        onPress={() => setOpen((v) => !v)}
      >
        <View className="flex-row items-center gap-2">
          {open ? (
            <ChevronDown color={chevronColor} size={14} />
          ) : (
            <ChevronRight color={chevronColor} size={14} />
          )}
          <Text className="text-sm font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
            {title}
          </Text>
        </View>
        <View className="rounded-full bg-focuslab-border px-2 py-0.5 dark:bg-dark-border">
          <Text className="text-[10px] font-bold text-focuslab-secondary dark:text-dark-text-secondary">
            {count}
          </Text>
        </View>
      </Pressable>
      {open ? <View className="gap-2">{children}</View> : null}
    </View>
  );
}

export function ProgressScreen() {
  const { user } = useAuth();
  const { data: state } = useJourneyState();
  const { keepItems, maybeItems, dismissedItems, upsert } = useToolkit();
  const { selectionChanged } = useHaptics();
  const { showToast } = useToast();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollRef = useRef<RNScrollView | null>(null);
  const previousTasksRef = useRef(state?.tasks ?? []);
  const [justUnlockedTaskIds, setJustUnlockedTaskIds] = useState<string[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
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

  const taskById = useMemo(() => {
    const map = new Map<string, JourneyTaskState>();
    for (const t of state?.tasks ?? []) {
      map.set(t.task.id, t);
    }
    return map;
  }, [state?.tasks]);

  const handleStatusChange = (taskId: string, status: ToolkitStatus) => {
    selectionChanged();
    upsert.mutate(
      { status, taskId },
      { onError: () => showToast("Couldn't update toolkit.", "error") },
    );
  };

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
            Toolkit
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your strategies
          </Text>
        </View>

        {state ? (
          <AnimatedCardEntrance delay={0}>
            <AppCard>
              <View className="flex-row items-center gap-5">
                <ProgressRing
                  completed={completedCount}
                  size={80}
                  strokeWidth={7}
                  total={state.tasks.length}
                />
                <View className="flex-1 gap-2">
                  <StreakBadge count={state.streakCount} size="sm" />
                  <Text className="text-xs text-focuslab-secondary dark:text-dark-text-secondary">
                    {completedCount} of {state.tasks.length} strategies explored
                  </Text>
                </View>
              </View>
            </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        <AnimatedCardEntrance delay={100}>
          <AppDisruptCard />
        </AnimatedCardEntrance>

        <AnimatedCardEntrance delay={200}>
          <AppCard>
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              🧰 My toolkit
            </Text>

            {keepItems.length === 0 && maybeItems.length === 0 && dismissedItems.length === 0 ? (
              <Text className="mt-3 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                Complete a task and choose &ldquo;Keep it&rdquo; during check-in to add strategies here.
              </Text>
            ) : null}

            {keepItems.length > 0 ? (
              <View className="mt-4 gap-2">
                {keepItems.map((item) => (
                  <ToolkitCard
                    item={item}
                    key={item.id}
                    onStatusChange={handleStatusChange}
                    taskState={taskById.get(item.task_id)}
                  />
                ))}
              </View>
            ) : null}

            <View className="mt-4 gap-1">
              <CollapsibleSection count={maybeItems.length} title="Maybe later">
                {maybeItems.map((item) => (
                  <ToolkitCard
                    item={item}
                    key={item.id}
                    muted
                    onStatusChange={handleStatusChange}
                    taskState={taskById.get(item.task_id)}
                  />
                ))}
              </CollapsibleSection>

              <CollapsibleSection count={dismissedItems.length} title="Not for me">
                {dismissedItems.map((item) => (
                  <ToolkitCard
                    item={item}
                    key={item.id}
                    muted
                    onStatusChange={handleStatusChange}
                    taskState={taskById.get(item.task_id)}
                  />
                ))}
              </CollapsibleSection>
            </View>
          </AppCard>
        </AnimatedCardEntrance>

        {state ? (
          <AnimatedCardEntrance delay={200}>
            <AppCard>
              <Pressable
                className="flex-row items-center justify-between"
                onPress={() => setMapExpanded((v) => !v)}
              >
                <View className="flex-row items-center gap-2">
                  <MapIcon color={isDark ? "#A5D6A7" : "#2D6A4F"} size={16} />
                  <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                    Journey map
                  </Text>
                </View>
                {mapExpanded ? (
                  <ChevronDown color={isDark ? "#A5D6A7" : "#2D6A4F"} size={18} />
                ) : (
                  <ChevronRight color={isDark ? "#A5D6A7" : "#2D6A4F"} size={18} />
                )}
              </Pressable>
              {mapExpanded ? (
                <View className="mt-4">
                  <JourneyMap
                    justUnlockedTaskIds={justUnlockedTaskIds}
                    onVisibleActiveNode={(y) => {
                      scrollRef.current?.scrollTo({
                        animated: true,
                        y: Math.max(0, y + 300),
                      });
                    }}
                    state={state}
                  />
                </View>
              ) : null}
            </AppCard>
          </AnimatedCardEntrance>
        ) : null}

        <AnimatedCardEntrance delay={300}>
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
