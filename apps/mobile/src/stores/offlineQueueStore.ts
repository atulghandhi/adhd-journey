import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import type { CompletionCheckInInput } from "@focuslab/shared";

export interface PendingCheckIn {
  id: string;
  input: CompletionCheckInInput;
  taskId: string;
}

interface OfflineQueueState {
  enqueueCheckIn: (item: PendingCheckIn) => void;
  pendingCheckIns: PendingCheckIn[];
  removeCheckIn: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      enqueueCheckIn: (item) =>
        set((state) => ({
          pendingCheckIns: [...state.pendingCheckIns, item],
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
