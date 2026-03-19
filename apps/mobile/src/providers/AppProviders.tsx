import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "../hooks/useAuth";
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

  useEffect(() => {
    if (!user?.id || pendingCheckIns.length === 0) {
      return;
    }

    let cancelled = false;

    const sync = async () => {
      for (const item of pendingCheckIns) {
        try {
          await submitCompletionCheckIn(item.taskId, item.input);

          if (!cancelled) {
            removeCheckIn(item.id);
            void queryClient.invalidateQueries({ queryKey: ["journey-state"] });
          }
        } catch {
          return;
        }
      }
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [pendingCheckIns, removeCheckIn, user?.id]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <OfflineQueueSync />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
