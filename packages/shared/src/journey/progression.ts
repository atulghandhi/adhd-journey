import {
  DEFAULT_JOURNEY_ID,
  FREE_TASK_LIMIT,
} from "../constants/journey";
import { calculateSpacedRepetitionSchedule } from "../algorithm/spacedRepetition";
import {
  addDaysToDateKey,
  differenceInCalendarDays,
  getDateKeyInTimeZone,
  normalizeNotificationPreferences,
} from "../timezone";
import type {
  CheckInInsert,
  CheckInRow,
  CompletionCheckInInput,
  CompletionTransition,
  JourneyReviewState,
  JourneyState,
  JourneyTaskState,
  PaymentStatus,
  ProfileRow,
  PromptResponses,
  RestartJourneyPayload,
  SkipCheckInInput,
  SpacedRepetitionConfigRow,
  SpacedRepetitionStateRow,
  TaskRow,
  UserProgressInsert,
  UserProgressRow,
} from "../types";

function cloneProgress(progressRows: UserProgressRow[]) {
  return progressRows.map((row) => ({ ...row }));
}

export function sortTasksByOrder(tasks: TaskRow[]) {
  return [...tasks].sort((left, right) => left.order - right.order);
}

export function getTaskTotalDays(task: TaskRow, progress: UserProgressRow | null) {
  return task.default_duration_days + (progress?.extended_days ?? 0);
}

export function isTaskPaywalled(order: number, paymentStatus: PaymentStatus) {
  return order > FREE_TASK_LIMIT && paymentStatus !== "paid";
}

export function hasPersistentThreadAccess(
  progressRows: UserProgressRow[],
  taskId: string,
) {
  return progressRows.some(
    (row) => row.task_id === taskId && row.status !== "locked",
  );
}

export function formatJourneyTaskSubtitle(
  task: TaskRow,
  progress: UserProgressRow | null,
) {
  const totalDays = getTaskTotalDays(task, progress);
  const currentDay = progress?.current_day ?? 1;

  if (totalDays <= 1) {
    return null;
  }

  return `Day ${currentDay} of ${totalDays}`;
}

export function createInitialJourneyProgress(
  tasks: TaskRow[],
  userId: string,
  journeyId = DEFAULT_JOURNEY_ID,
  now = new Date().toISOString(),
) {
  return sortTasksByOrder(tasks).map<UserProgressInsert>((task, index) => ({
    current_day: 1,
    extended_by_algorithm: false,
    extended_days: 0,
    journey_id: journeyId,
    status: index === 0 ? "active" : "locked",
    task_id: task.id,
    unlocked_at: index === 0 ? now : null,
    user_id: userId,
  }));
}

function getLatestCheckInForTask(checkIns: CheckInRow[], taskId: string) {
  const latest = checkIns
    .filter((checkIn) => checkIn.task_id === taskId)
    .sort((left, right) => right.checked_in_at.localeCompare(left.checked_in_at))[0];

  return latest?.checked_in_at ?? null;
}

function getActiveProgress(progressRows: UserProgressRow[]) {
  return progressRows.find((row) => row.status === "active") ?? null;
}

function getTaskIndexById(tasks: TaskRow[], taskId: string) {
  return tasks.findIndex((task) => task.id === taskId);
}

export function calculateStreak(
  checkIns: CheckInRow[],
  timeZone: string,
  now = new Date().toISOString(),
) {
  if (checkIns.length === 0) {
    return 0;
  }

  const uniqueDays = new Set(
    checkIns.map((checkIn) => getDateKeyInTimeZone(checkIn.checked_in_at, timeZone)),
  );
  const dayNumbers = [...uniqueDays]
    .map((day) => ({ day, value: Date.parse(`${day}T00:00:00.000Z`) / 86_400_000 }))
    .sort((left, right) => right.value - left.value);
  const todayKey = getDateKeyInTimeZone(now, timeZone);
  const yesterdayKey = addDaysToDateKey(todayKey, -1);
  const latestDay = dayNumbers[0]?.day;

  if (latestDay !== todayKey && latestDay !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  let previousValue: number | null = null;

  for (const day of dayNumbers) {
    if (previousValue === null) {
      streak += 1;
      previousValue = day.value;
      continue;
    }

    if (previousValue - day.value !== 1) {
      break;
    }

    streak += 1;
    previousValue = day.value;
  }

  return streak;
}

function resolveInactiveTask(
  tasks: TaskRow[],
  progressRows: UserProgressRow[],
  timeZone: string,
  paymentStatus: PaymentStatus,
  now: string,
) {
  const progressByTaskId = new Map(progressRows.map((row) => [row.task_id, row]));
  const firstIncompleteTask = tasks.find((task) => {
    const progress = progressByTaskId.get(task.id);

    return progress?.status !== "completed" && progress?.status !== "skipped";
  });

  if (!firstIncompleteTask) {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  const firstIncomplete = progressByTaskId.get(firstIncompleteTask.id);

  if (!firstIncomplete) {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  if (firstIncompleteTask.order === 1) {
    firstIncomplete.status = "active";
    firstIncomplete.unlocked_at = firstIncomplete.unlocked_at ?? now;

    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  const previousTask = tasks[tasks.findIndex((task) => task.id === firstIncompleteTask.id) - 1];
  const previousProgress = previousTask
    ? progressByTaskId.get(previousTask.id) ?? null
    : null;

  if (!previousProgress?.completed_at) {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  const unlockDate = addDaysToDateKey(
    getDateKeyInTimeZone(previousProgress.completed_at, timeZone),
    1,
  );
  const gateOpened =
    differenceInCalendarDays(now, previousProgress.completed_at, timeZone) >= 1;

  if (!gateOpened || isTaskPaywalled(firstIncompleteTask.order, paymentStatus)) {
    return {
      nextUnlockDate: gateOpened ? null : unlockDate,
      updatedProgress: progressRows,
    };
  }

  firstIncomplete.status = "active";
  firstIncomplete.unlocked_at = firstIncomplete.unlocked_at ?? now;

  return {
    nextUnlockDate: null,
    updatedProgress: progressRows,
  };
}

export function buildJourneyState(args: {
  checkIns: CheckInRow[];
  now?: string;
  paymentStatus: PaymentStatus;
  profile: ProfileRow | null;
  progressRows: UserProgressRow[];
  reviewStates?: SpacedRepetitionStateRow[];
  tasks: TaskRow[];
}) {
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(
    args.profile?.notification_preferences,
  );
  const sortedTasks = sortTasksByOrder(args.tasks);
  const clonedProgress = cloneProgress(args.progressRows);
  const activation = resolveInactiveTask(
    sortedTasks,
    clonedProgress,
    preferences.timezone,
    args.paymentStatus,
    now,
  );
  const progressByTaskId = new Map(
    activation.updatedProgress.map((row) => [row.task_id, row]),
  );
  const currentTaskProgress = getActiveProgress(activation.updatedProgress);
  const taskStates = sortedTasks.map<JourneyTaskState>((task) => {
    const progress = progressByTaskId.get(task.id) ?? null;
    const status = (progress?.status ?? "locked") as JourneyTaskState["status"];
    const isPaywalled = isTaskPaywalled(task.order, args.paymentStatus);

    return {
      canOpen: status !== "locked" && !isPaywalled,
      currentDay: progress?.current_day ?? 1,
      isActive: status === "active",
      isCompleted: status === "completed" || status === "skipped",
      isLocked: status === "locked",
      isPaywalled,
      lastCheckInAt: getLatestCheckInForTask(args.checkIns, task.id),
      progress,
      status,
      subtitle: formatJourneyTaskSubtitle(task, progress),
      task,
      totalDays: getTaskTotalDays(task, progress),
    };
  });
  const currentTask = taskStates.find((state) => state.isActive) ?? null;
  const nextLockedTask =
    taskStates.find((state) => state.isLocked && state.task.order > (currentTask?.task.order ?? 0)) ??
    taskStates.find((state) => state.isLocked) ??
    null;
  const reviewTask = selectDueReviewTask(
    args.reviewStates ?? [],
    sortedTasks,
    currentTaskProgress?.task_id ?? null,
    now,
    preferences.timezone,
  );
  const completedCount = taskStates.filter((state) => state.isCompleted).length;
  const firstIncompleteTask =
    taskStates.find((state) => !state.isCompleted) ?? null;
  const showPaywall =
    args.paymentStatus !== "paid" &&
    firstIncompleteTask?.task.order === FREE_TASK_LIMIT + 1 &&
    activation.nextUnlockDate === null &&
    !firstIncompleteTask.isCompleted;

  return {
    state: {
      activeTaskOrder: currentTask?.task.order ?? null,
      completedCount,
      currentTask,
      isPostCompletion: completedCount === sortedTasks.length,
      motivatingAnswer: args.profile?.motivating_answer ?? null,
      nextLockedTask,
      nextUnlockDate: activation.nextUnlockDate,
      reviewTask,
      showPaywall,
      streakCount: calculateStreak(args.checkIns, preferences.timezone, now),
      tasks: taskStates,
    } satisfies JourneyState,
    updatedProgress: activation.updatedProgress,
  };
}

export function selectDueReviewTask(
  reviewStates: SpacedRepetitionStateRow[],
  tasks: TaskRow[],
  activeTaskId: string | null,
  now: string,
  timeZone: string,
) {
  const todayKey = getDateKeyInTimeZone(now, timeZone);
  const dueStates = reviewStates
    .filter(
      (state) =>
        state.task_id !== activeTaskId &&
        state.next_review_date !== null &&
        state.next_review_date <= todayKey,
    )
    .sort((left, right) => {
      if (left.next_review_date === right.next_review_date) {
        return right.review_count - left.review_count;
      }

      return String(left.next_review_date).localeCompare(String(right.next_review_date));
    });
  const dueState = dueStates[0];

  if (!dueState) {
    return null;
  }

  const task = tasks.find((candidate) => candidate.id === dueState.task_id);

  if (!task) {
    return null;
  }

  return {
    dueDate: dueState.next_review_date ?? todayKey,
    state: dueState,
    task,
  } satisfies JourneyReviewState;
}

function normalizePromptResponses(value: PromptResponses | null | undefined) {
  if (!value) {
    return null;
  }

  const nextValue = Object.fromEntries(
    Object.entries(value).filter(([, field]) => typeof field === "string" && field.trim().length > 0),
  );

  return Object.keys(nextValue).length > 0 ? nextValue : null;
}

export function processCompletionCheckIn(args: {
  checkIns: CheckInRow[];
  input: CompletionCheckInInput;
  now?: string;
  paymentStatus: PaymentStatus;
  profile: ProfileRow;
  progressRows: UserProgressRow[];
  reviewState?: SpacedRepetitionStateRow | null;
  spacedRepetitionConfig?: Pick<
    SpacedRepetitionConfigRow,
    | "base_interval_days"
    | "decay_multiplier"
    | "ease_floor"
    | "max_reviews_per_day"
    | "struggle_threshold"
  >;
  task: TaskRow;
  tasks: TaskRow[];
}) {
  const checkedInAt = args.input.checkedInAt ?? args.now ?? new Date().toISOString();
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(
    args.profile.notification_preferences,
  );
  const clonedProgress = cloneProgress(args.progressRows);
  const currentProgress = clonedProgress.find((row) => row.task_id === args.task.id);

  if (!currentProgress) {
    throw new Error("User progress for the task was not found.");
  }

  if (currentProgress.status !== "active") {
    throw new Error("Only the active task can be checked in.");
  }

  if (args.input.quickRating < 1 || args.input.quickRating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (args.input.timeSpentSeconds < 0) {
    throw new Error("Time spent must be 0 or greater.");
  }

  const duplicateCheckIn = args.checkIns.some(
    (checkIn) =>
      checkIn.task_id === args.task.id &&
      checkIn.type === "completion" &&
      getDateKeyInTimeZone(checkIn.checked_in_at, preferences.timezone) ===
        getDateKeyInTimeZone(checkedInAt, preferences.timezone),
  );

  if (duplicateCheckIn) {
    throw new Error("A completion check-in already exists for this task today.");
  }

  const previousCheckIns = args.checkIns
    .filter((checkIn) => checkIn.task_id === args.task.id)
    .sort((left, right) => right.checked_in_at.localeCompare(left.checked_in_at));
  const inactiveDays =
    previousCheckIns[0] !== undefined
      ? Math.max(
          0,
          differenceInCalendarDays(
            checkedInAt,
            previousCheckIns[0].checked_in_at,
            preferences.timezone,
          ) - 1,
        )
      : 0;
  const nextReview = calculateSpacedRepetitionSchedule(
    {
      checkedInAt,
      currentState: args.reviewState,
      inactiveDays,
      taskId: args.task.id,
      timeZone: preferences.timezone,
      triedIt: args.input.triedIt,
      userId: args.profile.id,
      userJourneyId: currentProgress.journey_id,
      userRating: args.input.quickRating,
    },
    args.spacedRepetitionConfig,
  );
  const totalDaysBefore = getTaskTotalDays(args.task, currentProgress);
  const nextExtendedDays = Math.max(
    currentProgress.extended_days,
    nextReview.extensionDays,
  );
  const totalDaysAfter = args.task.default_duration_days + nextExtendedDays;
  const nextTaskDay = currentProgress.current_day + 1;
  const checkIn: CheckInInsert = {
    checked_in_at: checkedInAt,
    journey_id: currentProgress.journey_id,
    prompt_responses: normalizePromptResponses(args.input.promptResponses),
    quick_rating: args.input.quickRating,
    task_id: args.task.id,
    time_spent_seconds: args.input.timeSpentSeconds,
    tried_it: args.input.triedIt,
    type: "completion",
    user_id: args.profile.id,
  };

  if (nextTaskDay <= totalDaysAfter) {
    currentProgress.current_day = nextTaskDay;
    currentProgress.extended_days = nextExtendedDays;
    currentProgress.extended_by_algorithm =
      nextExtendedDays > 0 || currentProgress.extended_by_algorithm;

    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: addDaysToDateKey(
        getDateKeyInTimeZone(checkedInAt, preferences.timezone),
        1,
      ),
      progress: clonedProgress,
      reason:
        totalDaysAfter > totalDaysBefore ? "extended_task" : "continued_task",
      spacedRepetition: nextReview.nextState,
    } satisfies CompletionTransition;
  }

  currentProgress.completed_at = checkedInAt;
  currentProgress.status = "completed";
  const currentTaskIndex = getTaskIndexById(args.tasks, args.task.id);
  const nextTask = args.tasks[currentTaskIndex + 1];

  if (!nextTask) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: clonedProgress,
      reason: "completed_journey",
      spacedRepetition: nextReview.nextState,
    } satisfies CompletionTransition;
  }

  if (isTaskPaywalled(nextTask.order, args.paymentStatus)) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: clonedProgress,
      reason: "paywall_blocked",
      spacedRepetition: nextReview.nextState,
    } satisfies CompletionTransition;
  }

  const gateOpened =
    differenceInCalendarDays(now, checkedInAt, preferences.timezone) >= 1;
  const nextProgress = clonedProgress.find((row) => row.task_id === nextTask.id);

  if (!nextProgress) {
    throw new Error("Next task progress was not found.");
  }

  if (!gateOpened) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: addDaysToDateKey(
        getDateKeyInTimeZone(checkedInAt, preferences.timezone),
        1,
      ),
      progress: clonedProgress,
      reason: "waiting_until_tomorrow",
      spacedRepetition: nextReview.nextState,
    } satisfies CompletionTransition;
  }

  nextProgress.status = "active";
  nextProgress.unlocked_at = now;

  return {
    activatedTaskId: nextTask.id,
    checkIn,
    nextUnlockDate: null,
    progress: clonedProgress,
    reason: "unlocked_next_task",
    spacedRepetition: nextReview.nextState,
  } satisfies CompletionTransition;
}

export function processSkipCheckIn(args: {
  input: SkipCheckInInput;
  now?: string;
  paymentStatus: PaymentStatus;
  profile: ProfileRow;
  progressRows: UserProgressRow[];
  task: TaskRow;
  tasks: TaskRow[];
}) {
  const skippedAt = args.input.skippedAt ?? args.now ?? new Date().toISOString();
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(
    args.profile.notification_preferences,
  );
  const clonedProgress = cloneProgress(args.progressRows);
  const currentProgress = clonedProgress.find((row) => row.task_id === args.task.id);

  if (!currentProgress) {
    throw new Error("User progress for the task was not found.");
  }

  if (currentProgress.status !== "active") {
    throw new Error("Only the active task can be skipped.");
  }

  currentProgress.completed_at = skippedAt;
  currentProgress.status = "skipped";

  const checkIn: CheckInInsert = {
    checked_in_at: skippedAt,
    journey_id: currentProgress.journey_id,
    prompt_responses: { skip_reason: args.input.reason },
    quick_rating: 0,
    task_id: args.task.id,
    time_spent_seconds: 0,
    tried_it: false,
    type: "skip",
    user_id: args.profile.id,
  };

  const currentTaskIndex = getTaskIndexById(args.tasks, args.task.id);
  const nextTask = args.tasks[currentTaskIndex + 1];

  if (!nextTask) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: clonedProgress,
      reason: "task_skipped",
      spacedRepetition: null,
    } satisfies CompletionTransition;
  }

  if (isTaskPaywalled(nextTask.order, args.paymentStatus)) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: clonedProgress,
      reason: "task_skipped",
      spacedRepetition: null,
    } satisfies CompletionTransition;
  }

  const nextProgress = clonedProgress.find((row) => row.task_id === nextTask.id);

  if (!nextProgress) {
    throw new Error("Next task progress was not found.");
  }

  // Skipping immediately unlocks the next task (no waiting until tomorrow)
  nextProgress.status = "active";
  nextProgress.unlocked_at = now;

  return {
    activatedTaskId: nextTask.id,
    checkIn,
    nextUnlockDate: null,
    progress: clonedProgress,
    reason: "task_skipped",
    spacedRepetition: null,
  } satisfies CompletionTransition;
}

export function buildRestartJourneyPayload(args: {
  currentJourneyId: string;
  newJourneyId?: string;
  now?: string;
  tasks: TaskRow[];
  userId: string;
}) {
  const newJourneyId = args.newJourneyId ?? crypto.randomUUID();

  return {
    currentJourneyId: args.currentJourneyId,
    newJourneyId,
    profileUpdate: {
      current_journey_id: newJourneyId,
    },
    progress: createInitialJourneyProgress(
      args.tasks,
      args.userId,
      newJourneyId,
      args.now,
    ),
  } satisfies RestartJourneyPayload;
}
