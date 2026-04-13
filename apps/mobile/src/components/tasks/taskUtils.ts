export interface DragListConfig {
  instruction: string;
  maxItems: number;
  minItems: number;
  placeholder: string;
}

export interface BreathingCadenceConfig {
  exhaleSeconds: number;
  holdSeconds: number;
  inhaleSeconds: number;
}

export interface TimedChallengeConfig {
  breathingCadence: BreathingCadenceConfig | null;
  durationSeconds: number;
  label: string;
}

export interface BreathingExerciseConfig extends BreathingCadenceConfig {
  durationSeconds: number;
  label: string;
}

export interface ReflectionPromptsConfig {
  prompts: string[];
}

export interface JournalConfig {
  minCharacters: number;
  prompt: string;
}

export interface CommunityPromptConfig {
  navigateTo: string;
  prompt: string;
}

export interface ChecklistItem {
  label: string;
}

export interface ChecklistConfig {
  instruction: string;
  items: ChecklistItem[];
  minChecked: number;
}

export interface GuidedStep {
  prompt: string;
  inputType: "text" | "textarea" | "none";
  placeholder: string;
}

export interface GuidedStepsConfig {
  instruction: string;
  steps: GuidedStep[];
}

export interface TimeTrackerConfig {
  instruction: string;
  taskLabel: string;
  estimateMinutes: number;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function readNumber(value: unknown, fallback: number, minimum = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.round(value));
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const entries = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );

  return entries.length > 0 ? entries : fallback;
}

export function normalizeDragListConfig(config: unknown): DragListConfig {
  const source = asRecord(config);

  const minItems = readNumber(source.minItems, 3, 1);
  const maxItems = Math.max(minItems, readNumber(source.maxItems, 5, minItems));

  return {
    instruction: readString(source.instruction, "Add your items below"),
    maxItems,
    minItems,
    placeholder: readString(
      source.placeholder,
      "Add an interest, project, or hobby...",
    ),
  };
}

export function normalizeTimedChallengeConfig(config: unknown): TimedChallengeConfig {
  const source = asRecord(config);

  return {
    breathingCadence: normalizeBreathingCadence(source.breathingCadence),
    durationSeconds: readNumber(source.durationSeconds, 60, 1),
    label: readString(source.label, "Stay with it"),
  };
}

export function normalizeBreathingExerciseConfig(
  config: unknown,
): BreathingExerciseConfig {
  const source = asRecord(config);

  return {
    durationSeconds: readNumber(source.durationSeconds, 120, 1),
    exhaleSeconds: readNumber(source.exhaleSeconds, 6, 1),
    holdSeconds: readNumber(source.holdSeconds, 4, 0),
    inhaleSeconds: readNumber(source.inhaleSeconds, 4, 1),
    label: readString(source.label, "Follow the breath"),
  };
}

export function normalizeReflectionPromptsConfig(
  config: unknown,
): ReflectionPromptsConfig {
  const source = asRecord(config);

  return {
    prompts: readStringArray(source.prompts, [
      "What are you noticing right now?",
      "What helped you stay with this task?",
    ]),
  };
}

export function normalizeJournalConfig(config: unknown): JournalConfig {
  const source = asRecord(config);

  return {
    minCharacters: readNumber(source.minCharacters, 50, 1),
    prompt: readString(
      source.prompt,
      "Write about what this task brought up for you today.",
    ),
  };
}

export function normalizeCommunityPromptConfig(
  config: unknown,
): CommunityPromptConfig {
  const source = asRecord(config);

  return {
    navigateTo: readString(source.navigateTo, "/community"),
    prompt: readString(
      source.prompt,
      "Share one thing you learned from today's task with the community.",
    ),
  };
}

export function normalizeChecklistConfig(config: unknown): ChecklistConfig {
  const source = asRecord(config);

  const rawItems = Array.isArray(source.items) ? source.items : [];
  const items: ChecklistItem[] = rawItems
    .map((item) => {
      if (typeof item === "string") {
        return { label: item };
      }
      const rec = asRecord(item);
      const label = readString(rec.label, "");
      return label ? { label } : null;
    })
    .filter((item): item is ChecklistItem => item !== null);

  const fallbackItems: ChecklistItem[] = [{ label: "Done for today" }];

  return {
    instruction: readString(source.instruction, "Check off what you did today"),
    items: items.length > 0 ? items : fallbackItems,
    minChecked: readNumber(source.minChecked, 1, 1),
  };
}

export function normalizeGuidedStepsConfig(config: unknown): GuidedStepsConfig {
  const source = asRecord(config);

  const rawSteps = Array.isArray(source.steps) ? source.steps : [];
  const steps: GuidedStep[] = rawSteps
    .map((step) => {
      const rec = asRecord(step);
      const prompt = readString(rec.prompt, "");
      if (!prompt) return null;
      const inputType = rec.inputType === "text" || rec.inputType === "textarea" || rec.inputType === "none"
        ? rec.inputType
        : "textarea";
      return {
        prompt,
        inputType,
        placeholder: readString(rec.placeholder, "Write here..."),
      };
    })
    .filter((step): step is GuidedStep => step !== null);

  const fallbackSteps: GuidedStep[] = [
    { prompt: "What is on your mind?", inputType: "textarea", placeholder: "Write here..." },
  ];

  return {
    instruction: readString(source.instruction, "Follow each step"),
    steps: steps.length > 0 ? steps : fallbackSteps,
  };
}

export function normalizeTimeTrackerConfig(config: unknown): TimeTrackerConfig {
  const source = asRecord(config);

  return {
    instruction: readString(source.instruction, "Track how long this takes you"),
    taskLabel: readString(source.taskLabel, "My task"),
    estimateMinutes: readNumber(source.estimateMinutes, 0, 0),
  };
}

export function isChecklistComplete(checked: boolean[], minChecked: number) {
  return checked.filter(Boolean).length >= minChecked;
}

export function isGuidedStepsComplete(
  answers: string[],
  steps: GuidedStep[],
) {
  return steps.every((step, i) => {
    if (step.inputType === "none") return true;
    return (answers[i] ?? "").trim().length >= 5;
  });
}

export function normalizeBreathingCadence(value: unknown) {
  if (!value) {
    return null;
  }

  const source = asRecord(value);

  return {
    exhaleSeconds: readNumber(source.exhaleSeconds, 6, 1),
    holdSeconds: readNumber(source.holdSeconds, 4, 0),
    inhaleSeconds: readNumber(source.inhaleSeconds, 4, 1),
  } satisfies BreathingCadenceConfig;
}

export function isDragListComplete(items: string[], minItems: number) {
  return items.filter((item) => item.trim().length > 0).length >= minItems;
}

export function isReflectionAnswerValid(answer: string) {
  return answer.trim().length >= 10;
}

export function isJournalComplete(text: string, minCharacters: number) {
  return text.trim().length >= minCharacters;
}

export function getSecondsRemaining(targetTimeMs: number, nowMs = Date.now()) {
  return Math.max(0, Math.ceil((targetTimeMs - nowMs) / 1000));
}

export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getBreathingCycleSeconds(cadence: BreathingCadenceConfig) {
  return cadence.inhaleSeconds + cadence.holdSeconds + cadence.exhaleSeconds;
}

export function getBreathingPhaseLabel(
  elapsedSeconds: number,
  cadence: BreathingCadenceConfig,
) {
  const cycleSeconds = getBreathingCycleSeconds(cadence);
  const cyclePosition = elapsedSeconds % cycleSeconds;

  if (cyclePosition < cadence.inhaleSeconds) {
    return "Breathe in";
  }

  if (cyclePosition < cadence.inhaleSeconds + cadence.holdSeconds) {
    return "Hold";
  }

  return "Breathe out";
}

export function getCompletedBreathingCycles(
  elapsedSeconds: number,
  cadence: BreathingCadenceConfig,
  totalDurationSeconds: number,
) {
  const cycleSeconds = getBreathingCycleSeconds(cadence);
  const totalCycles = Math.max(1, Math.ceil(totalDurationSeconds / cycleSeconds));

  return {
    completedCycles: Math.min(totalCycles, Math.floor(elapsedSeconds / cycleSeconds)),
    totalCycles,
  };
}
