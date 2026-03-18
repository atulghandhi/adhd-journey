import {
  calculateSpacedRepetitionSchedule,
  getDefaultSpacedRepetitionConfig,
  getExtensionDays,
} from "../spacedRepetition";

describe("spaced repetition algorithm", () => {
  const config = getDefaultSpacedRepetitionConfig();
  const baseInput = {
    checkedInAt: "2026-03-17T09:00:00.000Z",
    taskId: "task-1",
    timeZone: "Europe/London",
    triedIt: true,
    userId: "user-1",
    userRating: 4,
  } as const;

  it("starts the first review at the base interval", () => {
    const result = calculateSpacedRepetitionSchedule(baseInput, config);

    expect(result.nextState.interval_days).toBe(1);
    expect(result.nextState.next_review_date).toBe("2026-03-18");
  });

  it("increments review count", () => {
    const result = calculateSpacedRepetitionSchedule(baseInput, config);

    expect(result.nextState.review_count).toBe(1);
  });

  it("uses a shorter second interval than vanilla SM-2", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        currentState: {
          ease_factor: 2.5,
          id: "sr-1",
          interval_days: 1,
          journey_id: "journey-1",
          last_review_rating: 4,
          next_review_date: "2026-03-18",
          review_count: 1,
          task_id: "task-1",
          user_id: "user-1",
        },
      },
      config,
    );

    expect(result.nextState.interval_days).toBe(2);
  });

  it("grows mature intervals using the ease factor", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        currentState: {
          ease_factor: 2.6,
          id: "sr-1",
          interval_days: 3,
          journey_id: "journey-1",
          last_review_rating: 5,
          next_review_date: "2026-03-20",
          review_count: 3,
          task_id: "task-1",
          user_id: "user-1",
        },
      },
      config,
    );

    expect(result.nextState.interval_days).toBe(7.8);
  });

  it("never drops ease factor below the configured floor", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        currentState: {
          ease_factor: 1.35,
          id: "sr-1",
          interval_days: 5,
          journey_id: "journey-1",
          last_review_rating: 1,
          next_review_date: "2026-03-22",
          review_count: 5,
          task_id: "task-1",
          user_id: "user-1",
        },
        userRating: 1,
      },
      config,
    );

    expect(result.nextState.ease_factor).toBe(config.ease_floor);
  });

  it("flags low ratings as struggling", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        userRating: 2,
      },
      config,
    );

    expect(result.isStruggling).toBe(true);
  });

  it("flags skipped attempts as struggling", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        triedIt: false,
      },
      config,
    );

    expect(result.isStruggling).toBe(true);
  });

  it("shrinks the interval when the user struggles", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        currentState: {
          ease_factor: 2.4,
          id: "sr-1",
          interval_days: 6,
          journey_id: "journey-1",
          last_review_rating: 4,
          next_review_date: "2026-03-23",
          review_count: 4,
          task_id: "task-1",
          user_id: "user-1",
        },
        userRating: 1,
      },
      config,
    );

    expect(result.nextState.interval_days).toBe(3);
  });

  it("applies decay when the user misses multiple days", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        currentState: {
          ease_factor: 2.4,
          id: "sr-1",
          interval_days: 4,
          journey_id: "journey-1",
          last_review_rating: 4,
          next_review_date: "2026-03-21",
          review_count: 3,
          task_id: "task-1",
          user_id: "user-1",
        },
        inactiveDays: 3,
      },
      config,
    );

    expect(result.nextState.interval_days).toBe(4.8);
  });

  it("returns no extension for successful check-ins", () => {
    expect(getExtensionDays(4, true)).toBe(0);
  });

  it("adds one extension day for borderline struggle", () => {
    expect(getExtensionDays(2, true)).toBe(1);
  });

  it("adds two extension days for severe struggle", () => {
    expect(getExtensionDays(1, true)).toBe(2);
  });

  it("adds two extension days when the task was not attempted", () => {
    expect(getExtensionDays(4, false)).toBe(2);
  });

  it("keeps next review dates anchored to the user timezone", () => {
    const result = calculateSpacedRepetitionSchedule(
      {
        ...baseInput,
        checkedInAt: "2026-03-17T23:30:00.000Z",
        timeZone: "America/New_York",
      },
      config,
    );

    expect(result.nextState.next_review_date).toBe("2026-03-18");
  });

  it("stores the new rating on the state", () => {
    const result = calculateSpacedRepetitionSchedule(baseInput, config);

    expect(result.nextState.last_review_rating).toBe(4);
  });

  it("throws on invalid ratings", () => {
    expect(() =>
      calculateSpacedRepetitionSchedule(
        {
          ...baseInput,
          userRating: 0,
        },
        config,
      ),
    ).toThrow("Rating must be between 1 and 5.");
  });
});
