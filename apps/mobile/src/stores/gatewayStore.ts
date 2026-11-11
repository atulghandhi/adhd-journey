import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  DailyOpenCount,
  GatewayConfig,
  StrategySnapshot,
} from "@focuslab/shared";
import { DEFAULT_GATEWAY_CONFIG } from "@focuslab/shared";

import type {
  GatewayStatus,
  PendingShieldRequest,
} from "../../modules/family-controls-bridge";

/** Open counts for Screen Time shields are aggregate, not per app. */
export const SHIELDED_APPS_ID = "shielded_apps";

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

  /** Live device state from the last native sync. Not persisted. */
  nativeStatus: GatewayStatus | null;

  /** The shield hand-off the breathing screen is serving. Not persisted. */
  shieldRequest: PendingShieldRequest | null;
}

export interface GatewayActions {
  /** Adopt what the native layer reports (auth, open count, session). */
  applyNativeStatus: (status: GatewayStatus) => void;

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

  /** Set or clear the shield hand-off being served. */
  setShieldRequest: (request: PendingShieldRequest | null) => void;

  /** Update the full gateway config. */
  updateConfig: (config: Partial<GatewayConfig>) => void;

  /** Write a new strategy snapshot. */
  updateStrategySnapshot: (snapshot: StrategySnapshot | null) => void;
}

export type GatewayStore = GatewayState & GatewayActions;

/**
 * Bring a config saved by an older build up to the current shape: fill in
 * settings added since, and make progressive friction match what its switch
 * promises (one extra second per open; older builds defaulted to three).
 */
export function normalizeGatewayConfig(
  saved: Partial<GatewayConfig> | undefined,
): GatewayConfig {
  const config: GatewayConfig = {
    ...DEFAULT_GATEWAY_CONFIG,
    ...saved,
    doomScroll: { ...DEFAULT_GATEWAY_CONFIG.doomScroll, ...saved?.doomScroll },
    escalation: { ...DEFAULT_GATEWAY_CONFIG.escalation, ...saved?.escalation },
  };

  config.escalation.incrementPerOpenSeconds =
    config.escalation.incrementPerOpenSeconds > 0 ? 1 : 0;

  // Screen Time shields track one aggregate count; the per-app "limit" older
  // builds stored for them was never editable and no longer means anything.
  config.openLimits = config.openLimits.filter(
    (limit) => limit.appId !== SHIELDED_APPS_ID,
  );

  return config;
}

export const useGatewayStore = create<GatewayStore>()(
  persist(
    (set, get) => ({
      // State
      completedFirstRun: false,
      config: { ...DEFAULT_GATEWAY_CONFIG },
      dailyOpenCounts: {},
      familyControlsAuthorized: false,
      nativeStatus: null,
      shieldRequest: null,
      strategySnapshot: null,

      // Actions
      applyNativeStatus: (status) =>
        set((state) => ({
          dailyOpenCounts: {
            ...state.dailyOpenCounts,
            [SHIELDED_APPS_ID]: { count: status.opensToday, date: todayKey() },
          },
          familyControlsAuthorized: status.authorized,
          nativeStatus: status,
        })),

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

      setShieldRequest: (request) => set({ shieldRequest: request }),

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
      // Live device state is re-read from native on every launch.
      partialize: (state) => ({
        completedFirstRun: state.completedFirstRun,
        config: state.config,
        dailyOpenCounts: state.dailyOpenCounts,
        familyControlsAuthorized: state.familyControlsAuthorized,
        strategySnapshot: state.strategySnapshot,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GatewayState>;
        return {
          ...current,
          ...saved,
          config: normalizeGatewayConfig(saved.config),
        };
      },
    },
  ),
);
