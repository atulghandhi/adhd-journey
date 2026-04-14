import { describe, expect, it } from "vitest";

import {
  computeGatewayDuration,
  DEFAULT_GATEWAY_CONFIG,
  formatHHMM,
  isInFreeWindow,
} from "../types/domain";
import type { GatewayConfig, TimeWindow } from "../types/domain";

// ---------------------------------------------------------------------------
// computeGatewayDuration
// ---------------------------------------------------------------------------

describe("computeGatewayDuration", () => {
  const config: GatewayConfig = {
    ...DEFAULT_GATEWAY_CONFIG,
    breathDurationSeconds: 5,
    escalation: {
      baseDurationSeconds: 5,
      capSeconds: 20,
      incrementPerOpenSeconds: 3,
    },
    openLimits: [
      { appId: "instagram", dailyLimit: 5, enabled: true },
      { appId: "tiktok", dailyLimit: 3, enabled: true },
      { appId: "youtube", dailyLimit: 8, enabled: false },
    ],
  };

  it("returns breath duration when under limit", () => {
    expect(computeGatewayDuration(config, "instagram", 1)).toBe(5);
    expect(computeGatewayDuration(config, "instagram", 5)).toBe(5);
  });

  it("returns escalating duration when over limit", () => {
    // 6th open: base + (6-5)*3 = 5+3 = 8
    expect(computeGatewayDuration(config, "instagram", 6)).toBe(8);
    // 7th: 5 + 2*3 = 11
    expect(computeGatewayDuration(config, "instagram", 7)).toBe(11);
    // 8th: 5 + 3*3 = 14
    expect(computeGatewayDuration(config, "instagram", 8)).toBe(14);
  });

  it("caps the duration at the configured maximum", () => {
    // 10th open: 5 + 5*3 = 20 (at cap)
    expect(computeGatewayDuration(config, "instagram", 10)).toBe(20);
    // 15th open: 5 + 10*3 = 35 → capped at 20
    expect(computeGatewayDuration(config, "instagram", 15)).toBe(20);
  });

  it("uses different limits per app", () => {
    // tiktok limit is 3
    expect(computeGatewayDuration(config, "tiktok", 3)).toBe(5);
    // 4th open of tiktok: 5 + (4-3)*3 = 8
    expect(computeGatewayDuration(config, "tiktok", 4)).toBe(8);
  });

  it("returns breath duration for disabled limits", () => {
    // youtube limit is disabled → treated as Infinity
    expect(computeGatewayDuration(config, "youtube", 100)).toBe(5);
  });

  it("returns breath duration for unknown apps (no limit configured)", () => {
    expect(computeGatewayDuration(config, "reddit", 50)).toBe(5);
  });

  it("handles zero open count", () => {
    expect(computeGatewayDuration(config, "instagram", 0)).toBe(5);
  });

  it("respects custom escalation configs", () => {
    const custom: GatewayConfig = {
      ...config,
      escalation: {
        baseDurationSeconds: 10,
        capSeconds: 30,
        incrementPerOpenSeconds: 5,
      },
    };
    // 6th open: 10 + (6-5)*5 = 15
    expect(computeGatewayDuration(custom, "instagram", 6)).toBe(15);
    // 10th open: 10 + (10-5)*5 = 35 → capped at 30
    expect(computeGatewayDuration(custom, "instagram", 10)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// isInFreeWindow
// ---------------------------------------------------------------------------

describe("isInFreeWindow", () => {
  const windows: TimeWindow[] = [
    { start: "17:00", end: "20:00" },
    { start: "12:00", end: "13:00" },
  ];

  it("returns true when time is within a window", () => {
    expect(isInFreeWindow(windows, "17:30")).toBe(true);
    expect(isInFreeWindow(windows, "19:59")).toBe(true);
    expect(isInFreeWindow(windows, "12:30")).toBe(true);
  });

  it("returns true at exact window boundaries", () => {
    expect(isInFreeWindow(windows, "17:00")).toBe(true);
    expect(isInFreeWindow(windows, "20:00")).toBe(true);
    expect(isInFreeWindow(windows, "12:00")).toBe(true);
    expect(isInFreeWindow(windows, "13:00")).toBe(true);
  });

  it("returns false when outside all windows", () => {
    expect(isInFreeWindow(windows, "09:00")).toBe(false);
    expect(isInFreeWindow(windows, "16:59")).toBe(false);
    expect(isInFreeWindow(windows, "20:01")).toBe(false);
    expect(isInFreeWindow(windows, "23:59")).toBe(false);
  });

  it("returns false with no windows configured", () => {
    expect(isInFreeWindow([], "12:00")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatHHMM
// ---------------------------------------------------------------------------

describe("formatHHMM", () => {
  it("formats single-digit hours with leading zero", () => {
    const d = new Date(2026, 3, 14, 9, 5);
    expect(formatHHMM(d)).toBe("09:05");
  });

  it("formats double-digit hours correctly", () => {
    const d = new Date(2026, 3, 14, 17, 30);
    expect(formatHHMM(d)).toBe("17:30");
  });

  it("formats midnight", () => {
    const d = new Date(2026, 3, 14, 0, 0);
    expect(formatHHMM(d)).toBe("00:00");
  });

  it("formats 23:59", () => {
    const d = new Date(2026, 3, 14, 23, 59);
    expect(formatHHMM(d)).toBe("23:59");
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_GATEWAY_CONFIG
// ---------------------------------------------------------------------------

describe("DEFAULT_GATEWAY_CONFIG", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_GATEWAY_CONFIG.enabled).toBe(false);
    expect(DEFAULT_GATEWAY_CONFIG.breathDurationSeconds).toBe(5);
    expect(DEFAULT_GATEWAY_CONFIG.escalation.baseDurationSeconds).toBe(5);
    expect(DEFAULT_GATEWAY_CONFIG.escalation.incrementPerOpenSeconds).toBe(3);
    expect(DEFAULT_GATEWAY_CONFIG.escalation.capSeconds).toBe(20);
    expect(DEFAULT_GATEWAY_CONFIG.doomScroll.enabled).toBe(true);
    expect(DEFAULT_GATEWAY_CONFIG.doomScroll.firstThresholdMinutes).toBe(10);
    expect(DEFAULT_GATEWAY_CONFIG.doomScroll.secondThresholdMinutes).toBe(30);
    expect(DEFAULT_GATEWAY_CONFIG.freeWindows).toEqual([]);
    expect(DEFAULT_GATEWAY_CONFIG.openLimits).toEqual([]);
  });
});
