import {
  normalizeBreathingCadence,
  normalizeBreathingExerciseConfig,
  normalizeCommunityPromptConfig,
  normalizeDragListConfig,
  normalizeJournalConfig,
  normalizeReflectionPromptsConfig,
  normalizeTimedChallengeConfig,
} from "../components/tasks/taskUtils";

describe("interaction_config edge-case parsing", () => {
  describe("normalizeDragListConfig", () => {
    it("returns safe defaults for null", () => {
      const config = normalizeDragListConfig(null);

      expect(config.minItems).toBe(3);
      expect(config.maxItems).toBe(5);
      expect(config.instruction).toBe("Add your items below");
    });

    it("returns safe defaults for undefined", () => {
      const config = normalizeDragListConfig(undefined);

      expect(config.minItems).toBe(3);
      expect(config.maxItems).toBe(5);
    });

    it("returns safe defaults for a string", () => {
      const config = normalizeDragListConfig("not an object");

      expect(config.minItems).toBe(3);
    });

    it("returns safe defaults for an array", () => {
      const config = normalizeDragListConfig([1, 2, 3]);

      expect(config.minItems).toBe(3);
    });

    it("clamps negative minItems to 1", () => {
      const config = normalizeDragListConfig({ minItems: -5 });

      expect(config.minItems).toBe(1);
    });

    it("ensures maxItems >= minItems", () => {
      const config = normalizeDragListConfig({ maxItems: 2, minItems: 5 });

      expect(config.minItems).toBe(5);
      expect(config.maxItems).toBe(5);
    });

    it("rounds non-integer values", () => {
      const config = normalizeDragListConfig({ minItems: 2.7 });

      expect(config.minItems).toBe(3);
    });

    it("falls back on NaN", () => {
      const config = normalizeDragListConfig({ minItems: NaN });

      expect(config.minItems).toBe(3);
    });

    it("falls back on Infinity", () => {
      const config = normalizeDragListConfig({ minItems: Infinity });

      expect(config.minItems).toBe(3);
    });

    it("uses fallback for empty string instruction", () => {
      const config = normalizeDragListConfig({ instruction: "   " });

      expect(config.instruction).toBe("Add your items below");
    });
  });

  describe("normalizeTimedChallengeConfig", () => {
    it("returns safe defaults for null", () => {
      const config = normalizeTimedChallengeConfig(null);

      expect(config.durationSeconds).toBe(60);
      expect(config.label).toBe("Stay with it");
      expect(config.breathingCadence).toBeNull();
    });

    it("clamps durationSeconds minimum to 1", () => {
      const config = normalizeTimedChallengeConfig({ durationSeconds: 0 });

      expect(config.durationSeconds).toBe(1);
    });

    it("parses embedded breathing cadence", () => {
      const config = normalizeTimedChallengeConfig({
        breathingCadence: {
          exhaleSeconds: 8,
          holdSeconds: 2,
          inhaleSeconds: 5,
        },
        durationSeconds: 120,
      });

      expect(config.breathingCadence).toEqual({
        exhaleSeconds: 8,
        holdSeconds: 2,
        inhaleSeconds: 5,
      });
    });
  });

  describe("normalizeBreathingExerciseConfig", () => {
    it("returns safe defaults for null", () => {
      const config = normalizeBreathingExerciseConfig(null);

      expect(config.durationSeconds).toBe(120);
      expect(config.inhaleSeconds).toBe(4);
      expect(config.holdSeconds).toBe(4);
      expect(config.exhaleSeconds).toBe(6);
      expect(config.label).toBe("Follow the breath");
    });

    it("clamps holdSeconds minimum to 0 (hold is optional)", () => {
      const config = normalizeBreathingExerciseConfig({ holdSeconds: -1 });

      expect(config.holdSeconds).toBe(0);
    });

    it("clamps inhaleSeconds minimum to 1", () => {
      const config = normalizeBreathingExerciseConfig({ inhaleSeconds: 0 });

      expect(config.inhaleSeconds).toBe(1);
    });
  });

  describe("normalizeReflectionPromptsConfig", () => {
    it("returns default prompts for null", () => {
      const config = normalizeReflectionPromptsConfig(null);

      expect(config.prompts.length).toBe(2);
    });

    it("filters out empty strings from prompts array", () => {
      const config = normalizeReflectionPromptsConfig({
        prompts: ["Valid", "", "   ", "Also valid"],
      });

      expect(config.prompts).toEqual(["Valid", "Also valid"]);
    });

    it("falls back to defaults when all prompts are empty", () => {
      const config = normalizeReflectionPromptsConfig({
        prompts: ["", "  "],
      });

      expect(config.prompts.length).toBe(2);
    });

    it("falls back to defaults when prompts is not an array", () => {
      const config = normalizeReflectionPromptsConfig({
        prompts: "not an array",
      });

      expect(config.prompts.length).toBe(2);
    });
  });

  describe("normalizeJournalConfig", () => {
    it("returns safe defaults for null", () => {
      const config = normalizeJournalConfig(null);

      expect(config.minCharacters).toBe(50);
      expect(config.prompt).toContain("Write about");
    });

    it("clamps minCharacters to at least 1", () => {
      const config = normalizeJournalConfig({ minCharacters: 0 });

      expect(config.minCharacters).toBe(1);
    });
  });

  describe("normalizeCommunityPromptConfig", () => {
    it("returns safe defaults for null", () => {
      const config = normalizeCommunityPromptConfig(null);

      expect(config.navigateTo).toBe("/community");
      expect(config.prompt).toContain("Share");
    });

    it("handles empty strings with fallback", () => {
      const config = normalizeCommunityPromptConfig({
        navigateTo: "",
        prompt: "   ",
      });

      expect(config.navigateTo).toBe("/community");
      expect(config.prompt).toContain("Share");
    });
  });

  describe("normalizeBreathingCadence", () => {
    it("returns null for falsy input", () => {
      expect(normalizeBreathingCadence(null)).toBeNull();
      expect(normalizeBreathingCadence(undefined)).toBeNull();
      expect(normalizeBreathingCadence(0)).toBeNull();
      expect(normalizeBreathingCadence("")).toBeNull();
    });

    it("returns defaults for empty object", () => {
      const cadence = normalizeBreathingCadence({});

      expect(cadence).toEqual({
        exhaleSeconds: 6,
        holdSeconds: 4,
        inhaleSeconds: 4,
      });
    });
  });
});
