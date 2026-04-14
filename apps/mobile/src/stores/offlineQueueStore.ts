import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import type { CompletionCheckInInput } from "@focuslab/shared";

export interface PendingCheckIn {
  id: string;
  input: CompletionCheckInInput;
  retryCount: number;
  taskId: string;
}

export const MAX_OFFLINE_RETRIES = 5;

interface OfflineQueueState {
  enqueueCheckIn: (item: PendingCheckIn) => void;
  incrementRetry: (id: string) => void;
  pendingCheckIns: PendingCheckIn[];
  removeCheckIn: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      enqueueCheckIn: (item) =>
        set((state) => ({
          pendingCheckIns: [...state.pendingCheckIns, { ...item, retryCount: item.retryCount ?? 0 }],
        })),
      incrementRetry: (id) =>
        set((state) => ({
          pendingCheckIns: state.pendingCheckIns.map((item) =>
            item.id === id ? { ...item, retryCount: (item.retryCount ?? 0) + 1 } : item,
          ),
        })),
      pendingCheckIns: [],
      removeCheckIn: (id) =>
        set((state) => ({
          pendingCheckIns: state.pendingCheckIns.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "focuslab-offline-queue",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
