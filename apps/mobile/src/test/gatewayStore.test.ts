import { DEFAULT_GATEWAY_CONFIG } from "@focuslab/shared";

import {
  SHIELDED_APPS_ID,
  normalizeGatewayConfig,
  useGatewayStore,
} from "../stores/gatewayStore";

// Reset store between tests
beforeEach(() => {
  useGatewayStore.setState({
    completedFirstRun: false,
    config: { ...DEFAULT_GATEWAY_CONFIG },
    dailyOpenCounts: {},
    familyControlsAuthorized: false,
    nativeStatus: null,
    shieldRequest: null,
    strategySnapshot: null,
  });
});

describe("gatewayStore", () => {
  // -----------------------------------------------------------------------
  // Open count tracking
  // -----------------------------------------------------------------------

  describe("incrementOpen / getOpenCount", () => {
    it("starts at 0 for a new app", () => {
      const count = useGatewayStore.getState().getOpenCount("instagram");
      expect(count).toBe(0);
    });

    it("increments and returns the new count", () => {
      const store = useGatewayStore.getState();
      expect(store.incrementOpen("instagram")).toBe(1);
      expect(store.incrementOpen("instagram")).toBe(2);
      expect(store.incrementOpen("instagram")).toBe(3);
    });

    it("tracks apps independently", () => {
      const store = useGatewayStore.getState();
      store.incrementOpen("instagram");
      store.incrementOpen("instagram");
      store.incrementOpen("tiktok");

      expect(useGatewayStore.getState().getOpenCount("instagram")).toBe(2);
      expect(useGatewayStore.getState().getOpenCount("tiktok")).toBe(1);
      expect(useGatewayStore.getState().getOpenCount("youtube")).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Daily reset
  // -----------------------------------------------------------------------

  describe("resetIfNewDay", () => {
    it("clears stale counts from a different date", () => {
      // Manually set a count with yesterday's date
      useGatewayStore.setState({
        dailyOpenCounts: {
          instagram: { count: 5, date: "2020-01-01" },
          tiktok: { count: 3, date: "2020-01-01" },
        },
      });

      useGatewayStore.getState().resetIfNewDay();

      expect(useGatewayStore.getState().getOpenCount("instagram")).toBe(0);
      expect(useGatewayStore.getState().getOpenCount("tiktok")).toBe(0);
    });

    it("preserves counts from today", () => {
      const store = useGatewayStore.getState();
      store.incrementOpen("instagram");
      store.incrementOpen("instagram");

      // resetIfNewDay should not clear today's counts
      useGatewayStore.getState().resetIfNewDay();

      expect(useGatewayStore.getState().getOpenCount("instagram")).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Config updates
  // -----------------------------------------------------------------------

  describe("updateConfig", () => {
    it("merges partial config", () => {
      useGatewayStore.getState().updateConfig({ enabled: true });
      expect(useGatewayStore.getState().config.enabled).toBe(true);
      // Other fields unchanged
      expect(useGatewayStore.getState().config.breathDurationSeconds).toBe(5);
    });

    it("updates open limits", () => {
      useGatewayStore.getState().updateConfig({
        openLimits: [{ appId: "instagram", dailyLimit: 3, enabled: true }],
      });

      const limits = useGatewayStore.getState().config.openLimits;
      expect(limits).toHaveLength(1);
      expect(limits[0].appId).toBe("instagram");
      expect(limits[0].dailyLimit).toBe(3);
    });

    it("updates escalation config", () => {
      useGatewayStore.getState().updateConfig({
        escalation: {
          baseDurationSeconds: 10,
          capSeconds: 30,
          incrementPerOpenSeconds: 5,
        },
      });

      const esc = useGatewayStore.getState().config.escalation;
      expect(esc.baseDurationSeconds).toBe(10);
      expect(esc.capSeconds).toBe(30);
      expect(esc.incrementPerOpenSeconds).toBe(5);
    });

    it("updates free windows", () => {
      useGatewayStore.getState().updateConfig({
        freeWindows: [{ start: "17:00", end: "20:00" }],
      });

      expect(useGatewayStore.getState().config.freeWindows).toHaveLength(1);
    });

    it("updates doom scroll config", () => {
      useGatewayStore.getState().updateConfig({
        doomScroll: {
          enabled: false,
          firstThresholdMinutes: 15,
          secondThresholdMinutes: 45,
        },
      });

      const ds = useGatewayStore.getState().config.doomScroll;
      expect(ds.enabled).toBe(false);
      expect(ds.firstThresholdMinutes).toBe(15);
      expect(ds.secondThresholdMinutes).toBe(45);
    });
  });

  // -----------------------------------------------------------------------
  // Strategy snapshot
  // -----------------------------------------------------------------------

  describe("updateStrategySnapshot", () => {
    it("stores a strategy snapshot", () => {
      useGatewayStore.getState().updateStrategySnapshot({
        strategyText: "Set a timer for 25 minutes...",
        taskOrder: 5,
        taskTitle: "The Pomodoro Method",
      });

      const snap = useGatewayStore.getState().strategySnapshot;
      expect(snap).not.toBeNull();
      expect(snap?.taskTitle).toBe("The Pomodoro Method");
      expect(snap?.taskOrder).toBe(5);
    });

    it("clears snapshot when set to null", () => {
      useGatewayStore.getState().updateStrategySnapshot({
        strategyText: "test",
        taskOrder: 1,
        taskTitle: "test",
      });
      useGatewayStore.getState().updateStrategySnapshot(null);

      expect(useGatewayStore.getState().strategySnapshot).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // First-run + authorization
  // -----------------------------------------------------------------------

  describe("markFirstRunComplete", () => {
    it("sets completedFirstRun to true", () => {
      expect(useGatewayStore.getState().completedFirstRun).toBe(false);
      useGatewayStore.getState().markFirstRunComplete();
      expect(useGatewayStore.getState().completedFirstRun).toBe(true);
    });
  });

  describe("setFamilyControlsAuthorized", () => {
    it("tracks authorization status", () => {
      expect(useGatewayStore.getState().familyControlsAuthorized).toBe(false);
      useGatewayStore.getState().setFamilyControlsAuthorized(true);
      expect(useGatewayStore.getState().familyControlsAuthorized).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Native status
  // -----------------------------------------------------------------------

  describe("applyNativeStatus", () => {
    it("adopts the native open count, authorization and session", () => {
      useGatewayStore.getState().applyNativeStatus({
        authorized: true,
        canOpenFromShield: true,
        opensToday: 4,
        selectionCount: 2,
        unlockUntil: 0,
      });

      const state = useGatewayStore.getState();
      expect(state.getOpenCount(SHIELDED_APPS_ID)).toBe(4);
      expect(state.familyControlsAuthorized).toBe(true);
      expect(state.nativeStatus?.selectionCount).toBe(2);
    });

    it("leaves per-app Shortcuts counts alone", () => {
      const store = useGatewayStore.getState();
      store.incrementOpen("instagram");
      store.applyNativeStatus({
        authorized: true,
        canOpenFromShield: false,
        opensToday: 9,
        selectionCount: 1,
        unlockUntil: 0,
      });

      expect(useGatewayStore.getState().getOpenCount("instagram")).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Upgrading saved settings
// ---------------------------------------------------------------------------

describe("normalizeGatewayConfig", () => {
  it("returns the defaults when nothing was saved", () => {
    expect(normalizeGatewayConfig(undefined)).toEqual(DEFAULT_GATEWAY_CONFIG);
  });

  it("fills in settings added after the config was saved", () => {
    const config = normalizeGatewayConfig({
      breathDurationSeconds: 3,
      enabled: true,
    });

    expect(config.breathDurationSeconds).toBe(3);
    expect(config.enabled).toBe(true);
    expect(config.pauseStyle).toBe("guided");
    expect(config.sessionMinutes).toBe(5);
  });

  it("makes progressive friction one second per open, as the switch says", () => {
    const on = normalizeGatewayConfig({
      escalation: { baseDurationSeconds: 5, capSeconds: 20, incrementPerOpenSeconds: 3 },
    });
    const off = normalizeGatewayConfig({
      escalation: { baseDurationSeconds: 5, capSeconds: 20, incrementPerOpenSeconds: 0 },
    });

    expect(on.escalation.incrementPerOpenSeconds).toBe(1);
    expect(off.escalation.incrementPerOpenSeconds).toBe(0);
  });

  it("drops the hidden open limit older builds stored for shields", () => {
    const config = normalizeGatewayConfig({
      openLimits: [
        { appId: SHIELDED_APPS_ID, dailyLimit: 15, enabled: true },
        { appId: "instagram", dailyLimit: 5, enabled: true },
      ],
    });

    expect(config.openLimits).toEqual([
      { appId: "instagram", dailyLimit: 5, enabled: true },
    ]);
  });

  it("does not modify the shared defaults", () => {
    normalizeGatewayConfig({
      escalation: { baseDurationSeconds: 5, capSeconds: 20, incrementPerOpenSeconds: 0 },
    });
    expect(DEFAULT_GATEWAY_CONFIG.escalation.incrementPerOpenSeconds).toBe(1);
  });
});
