import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  DailyOpenCount,
  GatewayConfig,
  StrategySnapshot,
} from "@focuslab/shared";
import { DEFAULT_GATEWAY_CONFIG } from "@focuslab/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface GatewayState {
  /** Whether the user has completed the first-run setup flow. */
  completedFirstRun: boolean;

  /** The full gateway configuration. */
  config: GatewayConfig;

  /** Per-app daily open counts, keyed by appId. */
  dailyOpenCounts: Record<string, DailyOpenCount>;

  /** Pre-computed strategy snapshot written by the main app. */
  strategySnapshot: StrategySnapshot | null;

  /** Whether FamilyControls authorization has been granted. */
  familyControlsAuthorized: boolean;
}

export interface GatewayActions {
  /** Get the current open count for an app (0 if new day). */
  getOpenCount: (appId: string) => number;

  /** Increment the open count for an app and return the new count. */
  incrementOpen: (appId: string) => number;

  /** Mark the first-run flow as completed. */
  markFirstRunComplete: () => void;

  /** Reset daily counts if it's a new day. */
  resetIfNewDay: () => void;

  /** Set the FamilyControls authorization status. */
  setFamilyControlsAuthorized: (authorized: boolean) => void;

  /** Update the full gateway config. */
  updateConfig: (config: Partial<GatewayConfig>) => void;

  /** Write a new strategy snapshot. */
  updateStrategySnapshot: (snapshot: StrategySnapshot | null) => void;
}

export type GatewayStore = GatewayState & GatewayActions;

export const useGatewayStore = create<GatewayStore>()(
  persist(
    (set, get) => ({
      // State
      completedFirstRun: false,
      config: { ...DEFAULT_GATEWAY_CONFIG },
      dailyOpenCounts: {},
      familyControlsAuthorized: false,
      strategySnapshot: null,

      // Actions
      getOpenCount: (appId: string) => {
        const entry = get().dailyOpenCounts[appId];
        if (!entry || entry.date !== todayKey()) return 0;
        return entry.count;
      },

      incrementOpen: (appId: string) => {
        const today = todayKey();
        const entry = get().dailyOpenCounts[appId];
        const current = entry && entry.date === today ? entry.count : 0;
        const next = current + 1;

        set((state) => ({
          dailyOpenCounts: {
            ...state.dailyOpenCounts,
            [appId]: { count: next, date: today },
          },
        }));

        return next;
      },

      markFirstRunComplete: () => set({ completedFirstRun: true }),

      resetIfNewDay: () => {
        const today = todayKey();
        const counts = get().dailyOpenCounts;
        const needsReset = Object.values(counts).some((c) => c.date !== today);
        if (!needsReset) return;

        const cleaned: Record<string, DailyOpenCount> = {};
        for (const [appId, entry] of Object.entries(counts)) {
          if (entry.date === today) {
            cleaned[appId] = entry;
          }
        }
        set({ dailyOpenCounts: cleaned });
      },

      setFamilyControlsAuthorized: (authorized) =>
        set({ familyControlsAuthorized: authorized }),

      updateConfig: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
        })),

      updateStrategySnapshot: (snapshot) =>
        set({ strategySnapshot: snapshot }),
    }),
    {
      name: "gateway-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
