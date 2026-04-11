import {
  buildNotificationDecision,
} from "../engine";
import type { NotificationPreferences } from "../../types";

const templates = [
  {
    body: "Body {{task_title}}",
    channel: "push" as const,
    created_at: "2026-03-17T00:00:00.000Z",
    id: "template-1",
    is_active: true,
    subject: "Subject {{day_number}}",
    tone_tag: "encouraging",
  },
];

const context = {
  dayNumber: 4,
  streak: 3,
  taskTitle: "Time Log",
  userName: "Ari",
};

function decide(now: string, preferences: NotificationPreferences) {
  return buildNotificationDecision({
    context,
    history: [],
    now,
    preferences,
    templates,
  });
}

describe("notification quiet-hours boundaries", () => {
  describe("overnight quiet window (21:00-08:00 UTC)", () => {
    const prefs: NotificationPreferences = {
      channels: ["push"],
      quiet_end: "08:00",
      quiet_start: "21:00",
      timezone: "UTC",
    };

    it("allows notification at 20:59", () => {
      expect(decide("2026-03-17T20:59:00.000Z", prefs).reason).toBe("ready");
    });

    it("blocks notification at 21:00 (quiet start)", () => {
      expect(decide("2026-03-17T21:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("blocks notification at 23:59", () => {
      expect(decide("2026-03-17T23:59:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("blocks notification at 00:00 (midnight)", () => {
      expect(decide("2026-03-18T00:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("blocks notification at 07:59", () => {
      expect(decide("2026-03-18T07:59:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("allows notification at 08:00 (quiet end)", () => {
      expect(decide("2026-03-17T08:00:00.000Z", prefs).reason).toBe("ready");
    });

    it("allows notification at 12:00 (midday)", () => {
      expect(decide("2026-03-17T12:00:00.000Z", prefs).reason).toBe("ready");
    });
  });

  describe("daytime quiet window (09:00-17:00)", () => {
    const prefs: NotificationPreferences = {
      channels: ["push"],
      quiet_end: "17:00",
      quiet_start: "09:00",
      timezone: "UTC",
    };

    it("allows notification at 08:59", () => {
      expect(decide("2026-03-17T08:59:00.000Z", prefs).reason).toBe("ready");
    });

    it("blocks at 09:00", () => {
      expect(decide("2026-03-17T09:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("blocks at 12:00", () => {
      expect(decide("2026-03-17T12:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("allows at 17:00", () => {
      expect(decide("2026-03-17T17:00:00.000Z", prefs).reason).toBe("ready");
    });

    it("allows at 22:00", () => {
      expect(decide("2026-03-17T22:00:00.000Z", prefs).reason).toBe("ready");
    });
  });

  describe("no quiet window (equal start and end)", () => {
    const prefs: NotificationPreferences = {
      channels: ["push"],
      quiet_end: "00:00",
      quiet_start: "00:00",
      timezone: "UTC",
    };

    it("allows notification at any time of day", () => {
      expect(decide("2026-03-17T00:00:00.000Z", prefs).reason).toBe("ready");
      expect(decide("2026-03-17T12:00:00.000Z", prefs).reason).toBe("ready");
      expect(decide("2026-03-17T23:59:00.000Z", prefs).reason).toBe("ready");
    });
  });

  describe("timezone-aware quiet hours", () => {
    it("respects US Eastern timezone", () => {
      const prefs: NotificationPreferences = {
        channels: ["push"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "America/New_York",
      };

      // 14:00 UTC = 09:00 or 10:00 ET depending on DST. Either way: within window
      expect(decide("2026-03-17T14:00:00.000Z", prefs).reason).toBe("ready");

      // 03:00 UTC = 22:00 or 23:00 ET. Either way: quiet hours
      expect(decide("2026-03-17T03:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("respects Asia/Tokyo timezone (+9, no DST)", () => {
      const prefs: NotificationPreferences = {
        channels: ["push"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "Asia/Tokyo",
      };

      // 01:00 UTC = 10:00 JST — within window
      expect(decide("2026-03-17T01:00:00.000Z", prefs).reason).toBe("ready");

      // 13:00 UTC = 22:00 JST — quiet hours
      expect(decide("2026-03-17T13:00:00.000Z", prefs).reason).toBe("outside_window");
    });

    it("handles Australia/Sydney (UTC+10/+11 with DST)", () => {
      const prefs: NotificationPreferences = {
        channels: ["push"],
        quiet_end: "08:00",
        quiet_start: "22:00",
        timezone: "Australia/Sydney",
      };

      // 00:00 UTC in March = 11:00 AEDT — within window
      expect(decide("2026-03-17T00:00:00.000Z", prefs).reason).toBe("ready");

      // 12:00 UTC in March = 23:00 AEDT — quiet hours
      expect(decide("2026-03-17T12:00:00.000Z", prefs).reason).toBe("outside_window");
    });
  });

  describe("edge: midnight-spanning quiet windows", () => {
    it("handles quiet window starting at midnight (00:00-06:00)", () => {
      const prefs: NotificationPreferences = {
        channels: ["push"],
        quiet_end: "06:00",
        quiet_start: "00:00",
        timezone: "UTC",
      };

      expect(decide("2026-03-17T00:00:00.000Z", prefs).reason).toBe("outside_window");
      expect(decide("2026-03-17T05:59:00.000Z", prefs).reason).toBe("outside_window");
      expect(decide("2026-03-17T06:00:00.000Z", prefs).reason).toBe("ready");
      expect(decide("2026-03-17T23:59:00.000Z", prefs).reason).toBe("ready");
    });

    it("handles quiet window ending at midnight (22:00-00:00)", () => {
      const prefs: NotificationPreferences = {
        channels: ["push"],
        quiet_end: "00:00",
        quiet_start: "22:00",
        timezone: "UTC",
      };

      expect(decide("2026-03-17T21:59:00.000Z", prefs).reason).toBe("ready");
      expect(decide("2026-03-17T22:00:00.000Z", prefs).reason).toBe("outside_window");
      expect(decide("2026-03-17T23:59:00.000Z", prefs).reason).toBe("outside_window");
      expect(decide("2026-03-18T00:00:00.000Z", prefs).reason).toBe("ready");
    });
  });
});
