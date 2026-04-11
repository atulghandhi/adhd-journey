import {
  addDaysToDateKey,
  differenceInCalendarDays,
  getDateKeyInTimeZone,
  getMinutesInTimeZone,
  getNotificationWindowDuration,
  getNotificationWindowStart,
  getTimeZoneParts,
  isWithinNotificationWindow,
  normalizeNotificationPreferences,
  parseClockValue,
} from "../timezone";

describe("getTimeZoneParts", () => {
  it("extracts parts in UTC", () => {
    const parts = getTimeZoneParts("2026-03-17T14:30:45.000Z", "UTC");

    expect(parts).toEqual({
      day: 17,
      hour: 14,
      minute: 30,
      month: 3,
      second: 45,
      year: 2026,
    });
  });

  it("converts to a different timezone", () => {
    // 14:30 UTC = 00:30+1 day in Asia/Tokyo (+9)
    const parts = getTimeZoneParts("2026-03-17T15:30:00.000Z", "Asia/Tokyo");

    expect(parts.hour).toBe(0);
    expect(parts.minute).toBe(30);
    expect(parts.day).toBe(18);
  });

  it("handles Date objects", () => {
    const date = new Date("2026-06-15T08:00:00.000Z");
    const parts = getTimeZoneParts(date, "UTC");

    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(6);
    expect(parts.day).toBe(15);
  });
});

describe("getDateKeyInTimeZone", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(getDateKeyInTimeZone("2026-03-17T10:00:00.000Z", "UTC")).toBe(
      "2026-03-17",
    );
  });

  it("rolls the date forward for late-UTC times in positive-offset timezones", () => {
    // 23:00 UTC = 08:00+1 in Asia/Tokyo
    expect(getDateKeyInTimeZone("2026-03-17T23:00:00.000Z", "Asia/Tokyo")).toBe(
      "2026-03-18",
    );
  });

  it("rolls the date backward for early-UTC times in negative-offset timezones", () => {
    // 02:00 UTC = 21:00-1 in America/New_York (EST, -5)
    expect(
      getDateKeyInTimeZone("2026-03-17T02:00:00.000Z", "America/New_York"),
    ).toBe("2026-03-16");
  });

  it("pads single-digit months and days", () => {
    expect(getDateKeyInTimeZone("2026-01-05T12:00:00.000Z", "UTC")).toBe(
      "2026-01-05",
    );
  });
});

describe("parseClockValue", () => {
  it("parses HH:MM to minutes since midnight", () => {
    expect(parseClockValue("08:00")).toBe(480);
    expect(parseClockValue("21:00")).toBe(1260);
    expect(parseClockValue("00:00")).toBe(0);
    expect(parseClockValue("23:59")).toBe(1439);
  });

  it("throws on invalid values", () => {
    expect(() => parseClockValue("25:00")).toThrow("Invalid clock value");
    expect(() => parseClockValue("12:60")).toThrow("Invalid clock value");
    expect(() => parseClockValue("abc")).toThrow("Invalid clock value");
  });
});

describe("getMinutesInTimeZone", () => {
  it("returns minutes since midnight in the given timezone", () => {
    // 14:30 UTC
    expect(getMinutesInTimeZone("2026-03-17T14:30:00.000Z", "UTC")).toBe(870);
  });

  it("adjusts for timezone offset", () => {
    // 14:30 UTC = 23:30 in Asia/Tokyo
    expect(
      getMinutesInTimeZone("2026-03-17T14:30:00.000Z", "Asia/Tokyo"),
    ).toBe(23 * 60 + 30);
  });
});

describe("differenceInCalendarDays", () => {
  it("returns 0 for same calendar day", () => {
    expect(
      differenceInCalendarDays(
        "2026-03-17T23:00:00.000Z",
        "2026-03-17T01:00:00.000Z",
        "UTC",
      ),
    ).toBe(0);
  });

  it("returns 1 for consecutive days", () => {
    expect(
      differenceInCalendarDays(
        "2026-03-18T01:00:00.000Z",
        "2026-03-17T23:00:00.000Z",
        "UTC",
      ),
    ).toBe(1);
  });

  it("accounts for timezone when crossing midnight", () => {
    // 23:30 UTC on Mar 17 is Mar 18 in Tokyo
    // 00:30 UTC on Mar 17 is still Mar 17 in Tokyo
    expect(
      differenceInCalendarDays(
        "2026-03-17T23:30:00.000Z",
        "2026-03-17T00:30:00.000Z",
        "Asia/Tokyo",
      ),
    ).toBe(1);
  });

  it("returns negative for earlier dates", () => {
    expect(
      differenceInCalendarDays(
        "2026-03-15T12:00:00.000Z",
        "2026-03-17T12:00:00.000Z",
        "UTC",
      ),
    ).toBe(-2);
  });
});

describe("addDaysToDateKey", () => {
  it("adds days forward", () => {
    expect(addDaysToDateKey("2026-03-17", 3)).toBe("2026-03-20");
  });

  it("handles month rollover", () => {
    expect(addDaysToDateKey("2026-03-30", 5)).toBe("2026-04-04");
  });

  it("handles year rollover", () => {
    expect(addDaysToDateKey("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("subtracts days", () => {
    expect(addDaysToDateKey("2026-03-03", -5)).toBe("2026-02-26");
  });

  it("throws on invalid input", () => {
    expect(() => addDaysToDateKey("bad-date", 1)).toThrow(
      "Invalid date key",
    );
  });
});

describe("normalizeNotificationPreferences", () => {
  it("returns defaults for null", () => {
    const result = normalizeNotificationPreferences(null);

    expect(result.timezone).toBe("UTC");
    expect(result.quiet_start).toBe("21:00");
    expect(result.quiet_end).toBe("08:00");
    expect(result.channels).toEqual(["push", "email"]);
  });

  it("returns defaults for non-object", () => {
    const result = normalizeNotificationPreferences("string" as never);

    expect(result.timezone).toBe("UTC");
  });

  it("returns defaults for array", () => {
    const result = normalizeNotificationPreferences([] as never);

    expect(result.timezone).toBe("UTC");
  });

  it("preserves valid overrides", () => {
    const result = normalizeNotificationPreferences({
      channels: ["email"],
      quiet_end: "09:00",
      quiet_start: "22:00",
      timezone: "America/New_York",
    });

    expect(result.timezone).toBe("America/New_York");
    expect(result.quiet_start).toBe("22:00");
    expect(result.quiet_end).toBe("09:00");
    expect(result.channels).toEqual(["email"]);
  });

  it("filters invalid channel values", () => {
    const result = normalizeNotificationPreferences({
      channels: ["push", "sms", 42],
    });

    expect(result.channels).toEqual(["push"]);
  });

  it("falls back to defaults when channels array is empty after filtering", () => {
    const result = normalizeNotificationPreferences({
      channels: ["sms"],
    });

    expect(result.channels).toEqual(["push", "email"]);
  });

  it("preserves reduced_motion boolean", () => {
    const result = normalizeNotificationPreferences({
      reduced_motion: true,
    });

    expect(result.reduced_motion).toBe(true);
  });

  it("omits reduced_motion for non-boolean", () => {
    const result = normalizeNotificationPreferences({
      reduced_motion: "yes",
    });

    expect(result.reduced_motion).toBeUndefined();
  });
});

describe("isWithinNotificationWindow", () => {
  const basePrefs = {
    channels: ["push" as const, "email" as const],
    quiet_end: "08:00",
    quiet_start: "21:00",
    timezone: "UTC",
  };

  it("returns true during allowed window", () => {
    expect(isWithinNotificationWindow("2026-03-17T12:00:00.000Z", basePrefs)).toBe(true);
  });

  it("returns false during quiet hours (late night)", () => {
    expect(isWithinNotificationWindow("2026-03-17T22:00:00.000Z", basePrefs)).toBe(false);
  });

  it("returns false during quiet hours (early morning)", () => {
    expect(isWithinNotificationWindow("2026-03-17T06:00:00.000Z", basePrefs)).toBe(false);
  });

  it("returns false at exact quiet_start boundary", () => {
    expect(isWithinNotificationWindow("2026-03-17T21:00:00.000Z", basePrefs)).toBe(false);
  });

  it("returns true at exact quiet_end boundary", () => {
    expect(isWithinNotificationWindow("2026-03-17T08:00:00.000Z", basePrefs)).toBe(true);
  });

  it("returns true when quiet_start equals quiet_end (no quiet window)", () => {
    const noQuiet = { ...basePrefs, quiet_end: "21:00", quiet_start: "21:00" };

    expect(isWithinNotificationWindow("2026-03-17T22:00:00.000Z", noQuiet)).toBe(true);
    expect(isWithinNotificationWindow("2026-03-17T06:00:00.000Z", noQuiet)).toBe(true);
  });

  it("handles non-wrapping quiet window (same day)", () => {
    // quiet from 09:00 to 17:00 (daytime quiet)
    const dayQuiet = { ...basePrefs, quiet_end: "17:00", quiet_start: "09:00" };

    expect(isWithinNotificationWindow("2026-03-17T08:00:00.000Z", dayQuiet)).toBe(true);
    expect(isWithinNotificationWindow("2026-03-17T12:00:00.000Z", dayQuiet)).toBe(false);
    expect(isWithinNotificationWindow("2026-03-17T18:00:00.000Z", dayQuiet)).toBe(true);
  });

  it("respects user timezone", () => {
    // 10:00 UTC = 19:00 in Asia/Tokyo — should be within window (quiet is 21-08)
    const tokyoPrefs = { ...basePrefs, timezone: "Asia/Tokyo" };

    expect(isWithinNotificationWindow("2026-03-17T10:00:00.000Z", tokyoPrefs)).toBe(true);

    // 13:00 UTC = 22:00 in Asia/Tokyo — should be outside window (quiet hours)
    expect(isWithinNotificationWindow("2026-03-17T13:00:00.000Z", tokyoPrefs)).toBe(false);
  });
});

describe("getNotificationWindowStart", () => {
  it("returns the quiet_end time as the window start", () => {
    expect(
      getNotificationWindowStart({
        channels: ["push"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "UTC",
      }),
    ).toBe("08:00");
  });

  it("handles midnight", () => {
    expect(
      getNotificationWindowStart({
        channels: ["push"],
        quiet_end: "00:00",
        quiet_start: "23:00",
        timezone: "UTC",
      }),
    ).toBe("00:00");
  });
});

describe("getNotificationWindowDuration", () => {
  it("returns full day when quiet_start equals quiet_end", () => {
    expect(
      getNotificationWindowDuration({
        channels: ["push"],
        quiet_end: "21:00",
        quiet_start: "21:00",
        timezone: "UTC",
      }),
    ).toBe(1440);
  });

  it("calculates duration for overnight quiet window (21:00-08:00)", () => {
    // Quiet: 21:00-08:00 = 11 hours = 660 min. Active: 13 hours = 780 min
    expect(
      getNotificationWindowDuration({
        channels: ["push"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "UTC",
      }),
    ).toBe(780);
  });

  it("calculates duration for same-day quiet window (09:00-17:00)", () => {
    // Quiet: 09:00-17:00 = 8 hours = 480 min. Active: 16 hours = 960 min
    expect(
      getNotificationWindowDuration({
        channels: ["push"],
        quiet_end: "17:00",
        quiet_start: "09:00",
        timezone: "UTC",
      }),
    ).toBe(960);
  });
});
