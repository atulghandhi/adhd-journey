import {
  DAILY_MOTIVATIONS,
  getDailyMotivation,
  getLocalDateKey,
} from "../constants/motivation";

describe("daily motivation helpers", () => {
  it("builds a stable local date key", () => {
    expect(getLocalDateKey(new Date(2026, 2, 20, 23, 59))).toBe("2026-03-20");
  });

  it("returns the same motivation throughout the same local day", () => {
    const morning = getDailyMotivation(new Date(2026, 2, 20, 8, 15));
    const evening = getDailyMotivation(new Date(2026, 2, 20, 22, 45));

    expect(morning).toBe(evening);
    expect(DAILY_MOTIVATIONS).toContain(morning);
  });
});
