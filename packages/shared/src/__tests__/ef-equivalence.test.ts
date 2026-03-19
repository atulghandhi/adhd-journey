import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DEFAULT_JOURNEY_ID,
  FREE_TASK_LIMIT,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CHANNELS,
} from "../constants/journey";
import {
  addDaysToDateKey,
  differenceInCalendarDays,
  getDateKeyInTimeZone,
  normalizeNotificationPreferences,
  isWithinNotificationWindow,
} from "../timezone";
import {
  sortTasksByOrder,
  isTaskPaywalled,
  createInitialJourneyProgress,
  calculateStreak,
} from "../journey/progression";

const EF_DOMAIN_PATH = resolve(
  __dirname,
  "../../../../supabase/functions/_shared/domain.ts",
);
const efSource = readFileSync(EF_DOMAIN_PATH, "utf-8");

describe("EF domain.ts ↔ shared package equivalence", () => {
  describe("constants match", () => {
    it("DEFAULT_JOURNEY_ID", () => {
      expect(efSource).toContain(
        `DEFAULT_JOURNEY_ID = "${DEFAULT_JOURNEY_ID}"`,
      );
    });

    it("FREE_TASK_LIMIT", () => {
      expect(efSource).toContain(`FREE_TASK_LIMIT = ${FREE_TASK_LIMIT}`);
    });

    it("NOTIFICATION_CHANNELS", () => {
      for (const channel of NOTIFICATION_CHANNELS) {
        expect(efSource).toContain(`"${channel}"`);
      }
    });

    it("DEFAULT_NOTIFICATION_PREFERENCES quiet hours", () => {
      expect(efSource).toContain(
        `quiet_end: "${DEFAULT_NOTIFICATION_PREFERENCES.quiet_end}"`,
      );
      expect(efSource).toContain(
        `quiet_start: "${DEFAULT_NOTIFICATION_PREFERENCES.quiet_start}"`,
      );
      expect(efSource).toContain(
        `timezone: "${DEFAULT_NOTIFICATION_PREFERENCES.timezone}"`,
      );
    });
  });

  describe("exported function signatures present in EF", () => {
    const expectedFunctions = [
      "sortTasksByOrder",
      "getDateKeyInTimeZone",
      "differenceInCalendarDays",
      "addDaysToDateKey",
      "normalizeNotificationPreferences",
      "isWithinNotificationWindow",
      "createInitialJourneyProgress",
      "isTaskPaywalled",
      "calculateStreak",
      "buildJourneyState",
      "processCheckIn",
      "calculateSpacedRepetitionSchedule",
      "buildNotificationDecision",
      "selectNotificationChannel",
      "selectNotificationTemplate",
    ];

    for (const name of expectedFunctions) {
      it(`exports ${name}`, () => {
        expect(efSource).toMatch(new RegExp(`export function ${name}\\b`));
      });
    }
  });

  describe("functional equivalence for pure helpers", () => {
    it("getDateKeyInTimeZone produces same output", () => {
      const cases = [
        { input: "2025-06-15T10:00:00Z", tz: "UTC", expected: "2025-06-15" },
        { input: "2025-06-15T23:00:00Z", tz: "America/New_York", expected: "2025-06-15" },
        { input: "2025-01-01T04:00:00Z", tz: "Asia/Tokyo", expected: "2025-01-01" },
      ];
      for (const { input, tz, expected } of cases) {
        expect(getDateKeyInTimeZone(input, tz)).toBe(expected);
      }
    });

    it("differenceInCalendarDays produces correct results", () => {
      expect(
        differenceInCalendarDays("2025-06-17T12:00:00Z", "2025-06-15T12:00:00Z", "UTC"),
      ).toBe(2);
      expect(
        differenceInCalendarDays("2025-06-15T12:00:00Z", "2025-06-15T12:00:00Z", "UTC"),
      ).toBe(0);
    });

    it("addDaysToDateKey produces correct results", () => {
      expect(addDaysToDateKey("2025-06-15", 3)).toBe("2025-06-18");
      expect(addDaysToDateKey("2025-12-30", 5)).toBe("2026-01-04");
    });

    it("isTaskPaywalled matches EF logic", () => {
      expect(isTaskPaywalled(15, "free")).toBe(false);
      expect(isTaskPaywalled(16, "free")).toBe(true);
      expect(isTaskPaywalled(16, "paid")).toBe(false);
      expect(isTaskPaywalled(30, "paid")).toBe(false);
    });

    it("normalizeNotificationPreferences returns defaults for null", () => {
      const result = normalizeNotificationPreferences(null);
      expect(result.quiet_end).toBe(DEFAULT_NOTIFICATION_PREFERENCES.quiet_end);
      expect(result.quiet_start).toBe(DEFAULT_NOTIFICATION_PREFERENCES.quiet_start);
      expect(result.timezone).toBe(DEFAULT_NOTIFICATION_PREFERENCES.timezone);
      expect(result.channels).toEqual([...NOTIFICATION_CHANNELS]);
    });

    it("normalizeNotificationPreferences preserves valid input", () => {
      const result = normalizeNotificationPreferences({
        channels: ["push"],
        quiet_end: "09:00",
        quiet_start: "22:00",
        timezone: "America/Chicago",
      });
      expect(result.channels).toEqual(["push"]);
      expect(result.quiet_end).toBe("09:00");
      expect(result.quiet_start).toBe("22:00");
      expect(result.timezone).toBe("America/Chicago");
    });

    it("isWithinNotificationWindow respects quiet hours", () => {
      const prefs = {
        channels: ["push" as const],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "UTC",
      };
      // 10:00 UTC → within window
      expect(isWithinNotificationWindow("2025-06-15T10:00:00Z", prefs)).toBe(true);
      // 22:00 UTC → outside window (in quiet period)
      expect(isWithinNotificationWindow("2025-06-15T22:00:00Z", prefs)).toBe(false);
      // 07:00 UTC → outside window (still in quiet period before 08:00)
      expect(isWithinNotificationWindow("2025-06-15T07:00:00Z", prefs)).toBe(false);
    });

    it("sortTasksByOrder sorts ascending by order field", () => {
      const tasks = [
        { order: 3 },
        { order: 1 },
        { order: 2 },
      ] as Parameters<typeof sortTasksByOrder>[0];
      const sorted = sortTasksByOrder(tasks);
      expect(sorted.map((t) => t.order)).toEqual([1, 2, 3]);
    });

    it("calculateStreak returns 0 for empty check-ins", () => {
      expect(calculateStreak([], "UTC")).toBe(0);
    });

    it("createInitialJourneyProgress sets first task active and rest locked", () => {
      const tasks = [
        { id: "t2", order: 2 },
        { id: "t1", order: 1 },
      ] as Parameters<typeof createInitialJourneyProgress>[0];
      const result = createInitialJourneyProgress(tasks, "user-1", undefined, "2025-06-15T00:00:00Z");
      expect(result).toHaveLength(2);
      expect(result[0]!.task_id).toBe("t1");
      expect(result[0]!.status).toBe("active");
      expect(result[0]!.unlocked_at).toBe("2025-06-15T00:00:00Z");
      expect(result[1]!.task_id).toBe("t2");
      expect(result[1]!.status).toBe("locked");
      expect(result[1]!.unlocked_at).toBeNull();
    });
  });
});
