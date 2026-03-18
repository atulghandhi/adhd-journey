import { DEFAULT_JOURNEY_ID } from "../constants/journey";
import { addDaysToDateKey, getDateKeyInTimeZone } from "../timezone";
import type {
  SpacedRepetitionConfigRow,
  SpacedRepetitionStateInsert,
  SpacedRepetitionStateRow,
} from "../types";

export interface SpacedRepetitionInput {
  checkedInAt: string;
  currentState?: SpacedRepetitionStateRow | null;
  inactiveDays?: number;
  taskId: string;
  timeZone: string;
  triedIt: boolean;
  userId: string;
  userRating: number;
  userJourneyId?: string;
}

export interface SpacedRepetitionResult {
  extensionDays: number;
  isStruggling: boolean;
  nextState: SpacedRepetitionStateInsert;
}

const DEFAULT_CONFIG: Pick<
  SpacedRepetitionConfigRow,
  | "base_interval_days"
  | "decay_multiplier"
  | "ease_floor"
  | "max_reviews_per_day"
  | "struggle_threshold"
> = {
  base_interval_days: 1,
  decay_multiplier: 0.5,
  ease_floor: 1.3,
  max_reviews_per_day: 1,
  struggle_threshold: 2,
};

export function getDefaultSpacedRepetitionConfig() {
  return {
    ...DEFAULT_CONFIG,
  };
}

export function calculateSpacedRepetitionSchedule(
  input: SpacedRepetitionInput,
  config: Pick<
    SpacedRepetitionConfigRow,
    | "base_interval_days"
    | "decay_multiplier"
    | "ease_floor"
    | "max_reviews_per_day"
    | "struggle_threshold"
  > = DEFAULT_CONFIG,
): SpacedRepetitionResult {
  if (input.userRating < 1 || input.userRating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const current = input.currentState;
  const easeFactor = current?.ease_factor ?? 2.5;
  const reviewCount = current?.review_count ?? 0;
  const previousInterval = current?.interval_days ?? config.base_interval_days;
  const isStruggling =
    input.userRating <= config.struggle_threshold || input.triedIt === false;

  const rawEaseFactor =
    easeFactor +
    (0.1 -
      (5 - input.userRating) * (0.08 + (5 - input.userRating) * 0.02));
  const nextEaseFactor = Math.max(config.ease_floor, Number(rawEaseFactor.toFixed(2)));

  let intervalDays = config.base_interval_days;

  if (reviewCount === 0) {
    intervalDays = config.base_interval_days;
  } else if (reviewCount === 1) {
    intervalDays = Math.max(config.base_interval_days + 1, previousInterval * 2);
  } else {
    intervalDays = previousInterval * nextEaseFactor;
  }

  if (isStruggling) {
    intervalDays = Math.max(
      config.base_interval_days,
      previousInterval * config.decay_multiplier,
    );
  }

  if ((input.inactiveDays ?? 0) >= 2) {
    intervalDays = Math.max(
      config.base_interval_days,
      intervalDays * config.decay_multiplier,
    );
  }

  const normalizedInterval = Math.max(
    config.base_interval_days,
    Math.round(intervalDays * 10) / 10,
  );
  const reviewDate = addDaysToDateKey(
    getDateKeyInTimeZone(input.checkedInAt, input.timeZone),
    Math.max(1, Math.ceil(normalizedInterval)),
  );

  return {
    extensionDays: getExtensionDays(input.userRating, input.triedIt),
    isStruggling,
    nextState: {
      ease_factor: nextEaseFactor,
      interval_days: normalizedInterval,
      journey_id: input.userJourneyId ?? DEFAULT_JOURNEY_ID,
      last_review_rating: input.userRating,
      next_review_date: reviewDate,
      review_count: reviewCount + 1,
      task_id: input.taskId,
      user_id: input.userId,
    },
  };
}

export function getExtensionDays(rating: number, triedIt: boolean) {
  if (!triedIt || rating <= 1) {
    return 2;
  }

  if (rating <= 2) {
    return 1;
  }

  return 0;
}
