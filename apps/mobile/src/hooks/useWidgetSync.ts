import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { setWidgetData } from "../../modules/widget-data-bridge";
import { useJourneyState } from "./useJourneyState";

/**
 * Syncs journey state to the iOS widget via App Group UserDefaults.
 * Call once in the root layout / providers. On Android/web this is a no-op.
 *
 * Triggers on:
 * - Journey state changes (TanStack Query refetch)
 * - App coming to foreground
 */
export function useWidgetSync(): void {
  const { data: state } = useJourneyState();
  const lastJson = useRef<string>("");

  // Heartbeat: write a diagnostic payload on mount so we can tell the
  // difference between "bridge broken" and "journey state not loaded yet".
  // If the widget shows this task title after first launch, we know the
  // native bridge + App Group are working.
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const heartbeat = JSON.stringify({
      streakCount: 0,
      completedCount: 0,
      totalTasks: 30,
      currentTaskTitle: "Loading your task…",
      currentTaskDay: 0,
      currentTaskDescription: `Widget bridge OK @ ${new Date().toLocaleTimeString()}`,
      todayTaskCompleted: false,
      lastUpdated: new Date().toISOString(),
    });
    setWidgetData(heartbeat);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios" || !state) return;

    const json = JSON.stringify({
      streakCount: state.streakCount,
      completedCount: state.completedCount,
      totalTasks: state.tasks.length,
      currentTaskTitle: state.currentTask?.task.title ?? null,
      currentTaskDay: state.currentTask?.task.order ?? null,
      currentTaskDescription:
        state.currentTask?.task.task_body?.slice(0, 300) ?? null,
      todayTaskCompleted:
        state.currentTask === null && state.nextUnlockDate !== null,
      lastUpdated: new Date().toISOString(),
    });

    // Only write if data actually changed
    if (json !== lastJson.current) {
      lastJson.current = json;
      setWidgetData(json);
    }
  }, [state]);

  // Also refresh when app comes to foreground
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && lastJson.current) {
        setWidgetData(lastJson.current);
      }
    });

    return () => subscription.remove();
  }, []);
}
