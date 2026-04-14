import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { useWidgetSync } from "../hooks/useWidgetSync";
import { submitCompletionCheckIn } from "../lib/journey-api";
import { queryClient } from "../lib/queryClient";
import { useOfflineQueueStore } from "../stores/offlineQueueStore";
import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

function OfflineQueueSync() {
  const { user } = useAuth();
  const pendingCheckIns = useOfflineQueueStore((state) => state.pendingCheckIns);
  const removeCheckIn = useOfflineQueueStore((state) => state.removeCheckIn);
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    if (!user?.id || pendingCheckIns.length === 0 || isSyncing.current) {
      return;
    }

    isSyncing.current = true;

    for (const item of pendingCheckIns) {
      try {
        await submitCompletionCheckIn(item.taskId, item.input);
        removeCheckIn(item.id);
        void queryClient.invalidateQueries({ queryKey: ["journey-state"] });
      } catch {
        break;
      }
    }

    isSyncing.current = false;
  }, [pendingCheckIns, removeCheckIn, user?.id]);

  // Retry on state changes (new items, user login)
  useEffect(() => {
    void sync();
  }, [sync]);

  // Retry when app comes to foreground (network recovery)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void sync();
      }
    });

    return () => subscription.remove();
  }, [sync]);

  return null;
}

function WidgetSync() {
  useWidgetSync();
  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <OfflineQueueSync />
            <WidgetSync />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
