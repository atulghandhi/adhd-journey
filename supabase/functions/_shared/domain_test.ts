import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  addDaysToDateKey,
  calculateSpacedRepetitionSchedule,
  calculateStreak,
  differenceInCalendarDays,
  getDateKeyInTimeZone,
  isWithinNotificationWindow,
  normalizeNotificationPreferences,
  sortTasksByOrder,
} from "./domain.ts";
import type { CheckInRow, TaskRow } from "./domain.ts";

// ─── Date/Timezone utilities ─────────────────────────────────────────────────

Deno.test("getDateKeyInTimeZone returns YYYY-MM-DD in UTC", () => {
  assertEquals(getDateKeyInTimeZone("2026-03-17T10:00:00.000Z", "UTC"), "2026-03-17");
});

Deno.test("getDateKeyInTimeZone rolls date for positive offset", () => {
  assertEquals(getDateKeyInTimeZone("2026-03-17T23:00:00.000Z", "Asia/Tokyo"), "2026-03-18");
});

Deno.test("differenceInCalendarDays returns 0 for same day", () => {
  assertEquals(
    differenceInCalendarDays("2026-03-17T23:00:00.000Z", "2026-03-17T01:00:00.000Z", "UTC"),
    0,
  );
});

Deno.test("differenceInCalendarDays returns 1 for consecutive days", () => {
  assertEquals(
    differenceInCalendarDays("2026-03-18T01:00:00.000Z", "2026-03-17T23:00:00.000Z", "UTC"),
    1,
  );
});

Deno.test("addDaysToDateKey adds days and handles rollover", () => {
  assertEquals(addDaysToDateKey("2026-03-30", 5), "2026-04-04");
  assertEquals(addDaysToDateKey("2026-12-30", 5), "2027-01-04");
});

// ─── normalizeNotificationPreferences ────────────────────────────────────────

Deno.test("normalizeNotificationPreferences returns defaults for null", () => {
  const result = normalizeNotificationPreferences(null);

  assertEquals(result.timezone, "UTC");
  assertEquals(result.quiet_start, "21:00");
  assertEquals(result.quiet_end, "08:00");
  assertEquals(result.channels, ["push", "email"]);
});

Deno.test("normalizeNotificationPreferences preserves valid overrides", () => {
  const result = normalizeNotificationPreferences({
    channels: ["email"],
    quiet_end: "09:00",
    quiet_start: "22:00",
    timezone: "America/New_York",
  });

  assertEquals(result.timezone, "America/New_York");
  assertEquals(result.channels, ["email"]);
});

// ─── isWithinNotificationWindow ──────────────────────────────────────────────

Deno.test("isWithinNotificationWindow allows during active window", () => {
  assertEquals(
    isWithinNotificationWindow("2026-03-17T12:00:00.000Z", {
      channels: ["push"],
      quiet_end: "08:00",
      quiet_start: "21:00",
      timezone: "UTC",
    }),
    true,
  );
});

Deno.test("isWithinNotificationWindow blocks during quiet hours", () => {
  assertEquals(
    isWithinNotificationWindow("2026-03-17T22:00:00.000Z", {
      channels: ["push"],
      quiet_end: "08:00",
      quiet_start: "21:00",
      timezone: "UTC",
    }),
    false,
  );
});

Deno.test("isWithinNotificationWindow returns true when no quiet window", () => {
  assertEquals(
    isWithinNotificationWindow("2026-03-17T23:00:00.000Z", {
      channels: ["push"],
      quiet_end: "21:00",
      quiet_start: "21:00",
      timezone: "UTC",
    }),
    true,
  );
});

// ─── sortTasksByOrder ────────────────────────────────────────────────────────

Deno.test("sortTasksByOrder sorts by order ascending", () => {
  const tasks = [
    { order: 3 } as TaskRow,
    { order: 1 } as TaskRow,
    { order: 2 } as TaskRow,
  ];
  const sorted = sortTasksByOrder(tasks);

  assertEquals(sorted[0].order, 1);
  assertEquals(sorted[1].order, 2);
  assertEquals(sorted[2].order, 3);
});

// ─── calculateStreak ─────────────────────────────────────────────────────────

Deno.test("calculateStreak returns 0 for empty check-ins", () => {
  assertEquals(calculateStreak([], "UTC"), 0);
});

Deno.test("calculateStreak counts consecutive days", () => {
  const checkIns = [
    { checked_in_at: "2026-03-17T10:00:00.000Z" },
    { checked_in_at: "2026-03-16T10:00:00.000Z" },
    { checked_in_at: "2026-03-15T10:00:00.000Z" },
  ] as CheckInRow[];

  assertEquals(calculateStreak(checkIns, "UTC", "2026-03-17T12:00:00.000Z"), 3);
});

Deno.test("calculateStreak breaks on gap", () => {
  const checkIns = [
    { checked_in_at: "2026-03-17T10:00:00.000Z" },
    { checked_in_at: "2026-03-15T10:00:00.000Z" },
  ] as CheckInRow[];

  assertEquals(calculateStreak(checkIns, "UTC", "2026-03-17T12:00:00.000Z"), 1);
});

// ─── calculateSpacedRepetitionSchedule ───────────────────────────────────────

Deno.test("SR schedule starts at base interval for first review", () => {
  const result = calculateSpacedRepetitionSchedule({
    checkedInAt: "2026-03-17T09:00:00.000Z",
    taskId: "task-1",
    timeZone: "UTC",
    triedIt: true,
    userId: "user-1",
    userJourneyId: "journey-1",
    userRating: 4,
  });

  assertEquals(result.nextState.interval_days, 1);
  assertEquals(result.nextState.next_review_date, "2026-03-18");
  assertEquals(result.nextState.review_count, 1);
});

Deno.test("SR schedule decays interval when user is struggling", () => {
  const result = calculateSpacedRepetitionSchedule({
    checkedInAt: "2026-03-17T09:00:00.000Z",
    currentState: {
      ease_factor: 2.5,
      id: "sr-1",
      interval_days: 4,
      journey_id: "journey-1",
      last_review_rating: 4,
      next_review_date: "2026-03-17",
      review_count: 3,
      task_id: "task-1",
      user_id: "user-1",
    },
    taskId: "task-1",
    timeZone: "UTC",
    triedIt: true,
    userId: "user-1",
    userJourneyId: "journey-1",
    userRating: 1,
  });

  assertEquals(result.isStruggling, true);
  assertEquals(result.nextState.interval_days <= 4, true);
});
