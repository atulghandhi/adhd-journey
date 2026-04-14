import { DEFAULT_GATEWAY_CONFIG } from "@focuslab/shared";

import { useGatewayStore } from "../stores/gatewayStore";

// Reset store between tests
beforeEach(() => {
  useGatewayStore.setState({
    completedFirstRun: false,
    config: { ...DEFAULT_GATEWAY_CONFIG },
    dailyOpenCounts: {},
    familyControlsAuthorized: false,
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
});
