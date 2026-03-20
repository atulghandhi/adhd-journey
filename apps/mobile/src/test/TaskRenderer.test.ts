import {
  formatSeconds,
  getBreathingPhaseLabel,
  getSecondsRemaining,
  isDragListComplete,
  isJournalComplete,
  isReflectionAnswerValid,
  normalizeDragListConfig,
  normalizeJournalConfig,
  normalizeReflectionPromptsConfig,
  normalizeTimedChallengeConfig,
} from "../components/tasks/taskUtils";

describe("task interaction helpers", () => {
  it("normalizes drag list config with defaults", () => {
    expect(normalizeDragListConfig({ minItems: 4 })).toEqual({
      instruction: "Add your items below",
      maxItems: 5,
      minItems: 4,
      placeholder: "Add an interest, project, or hobby...",
    });
  });

  it("marks drag list complete only when enough items exist", () => {
    expect(isDragListComplete(["a", "b"], 3)).toBe(false);
    expect(isDragListComplete(["a", "b", "c"], 3)).toBe(true);
  });

  it("normalizes timed challenge config and countdown helpers", () => {
    const config = normalizeTimedChallengeConfig({
      durationSeconds: 90,
      label: "Sit with it",
    });

    expect(config.durationSeconds).toBe(90);
    expect(config.label).toBe("Sit with it");
    expect(getSecondsRemaining(10_000, 6_100)).toBe(4);
    expect(formatSeconds(65)).toBe("01:05");
  });

  it("validates reflection answers with a minimum length", () => {
    const config = normalizeReflectionPromptsConfig({
      prompts: ["One", "Two"],
    });

    expect(config.prompts).toEqual(["One", "Two"]);
    expect(isReflectionAnswerValid("too short")).toBe(false);
    expect(isReflectionAnswerValid("This is long enough")).toBe(true);
  });

  it("normalizes journal config and completion threshold", () => {
    const config = normalizeJournalConfig({
      minCharacters: 12,
      prompt: "Write something reflective",
    });

    expect(config).toEqual({
      minCharacters: 12,
      prompt: "Write something reflective",
    });
    expect(isJournalComplete("short", 12)).toBe(false);
    expect(isJournalComplete("long enough text", 12)).toBe(true);
  });

  it("derives the correct breathing phase label", () => {
    const cadence = {
      exhaleSeconds: 6,
      holdSeconds: 4,
      inhaleSeconds: 4,
    };

    expect(getBreathingPhaseLabel(1, cadence)).toBe("Breathe in");
    expect(getBreathingPhaseLabel(5, cadence)).toBe("Hold");
    expect(getBreathingPhaseLabel(10, cadence)).toBe("Breathe out");
  });
});
