import type {
  Database,
  Json,
} from "../../../packages/shared/src/types/database.ts";

export const DEFAULT_JOURNEY_ID = "00000000-0000-0000-0000-000000000001";
export const FREE_TASK_LIMIT = 15;
export const NOTIFICATION_CHANNELS = ["push", "email"] as const;
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  channels: [...NOTIFICATION_CHANNELS],
  quiet_end: "08:00",
  quiet_start: "21:00",
  timezone: "UTC",
} as const;

type TableName = keyof Database["public"]["Tables"];
type TableRow<Name extends TableName> = Database["public"]["Tables"][Name]["Row"];
type TableInsert<Name extends TableName> =
  Database["public"]["Tables"][Name]["Insert"];

export type ProfileRow = TableRow<"profiles">;
export type TaskRow = TableRow<"tasks">;
export type UserProgressRow = TableRow<"user_progress">;
export type UserProgressInsert = TableInsert<"user_progress">;
export type CheckInRow = TableRow<"check_ins">;
export type CheckInInsert = TableInsert<"check_ins">;
export type SpacedRepetitionRow = TableRow<"spaced_repetition_state">;
export type SpacedRepetitionInsert = TableInsert<"spaced_repetition_state">;
export type NotificationTemplateRow = TableRow<"notification_templates">;
export type NotificationLogRow = TableRow<"notification_log">;
export type PushTokenRow = TableRow<"push_tokens">;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type PaymentStatus = "free" | "paid";

export interface NotificationPreferences {
  channels: NotificationChannel[];
  quiet_end: string;
  quiet_start: string;
  timezone: string;
}

export interface JourneyState {
  activeTaskOrder: number | null;
  completedCount: number;
  currentTask: {
    currentDay: number;
    subtitle: string | null;
    task: TaskRow;
    totalDays: number;
  } | null;
  isPostCompletion: boolean;
  motivatingAnswer: string | null;
  nextUnlockDate: string | null;
  reviewTask: {
    dueDate: string;
    task: TaskRow;
  } | null;
  showPaywall: boolean;
  streakCount: number;
  tasks: Array<{
    canOpen: boolean;
    currentDay: number;
    isActive: boolean;
    isCompleted: boolean;
    isLocked: boolean;
    isPaywalled: boolean;
    lastCheckInAt: string | null;
    status: string;
    subtitle: string | null;
    task: TaskRow;
    totalDays: number;
  }>;
}

export interface CompletionInput {
  checkedInAt?: string;
  promptResponses?: Record<string, string | undefined> | null;
  quickRating: number;
  taskId: string;
  timeSpentSeconds: number;
  triedIt: boolean;
  type?: "completion" | "reinforcement_review";
}

export interface NotificationContext {
  dayNumber: number;
  streak: number;
  taskTitle: string;
  userName: string | null;
}

export interface NotificationDecision {
  channel: NotificationChannel | null;
  reason:
    | "already_sent_today"
    | "missing_channel"
    | "missing_template"
    | "outside_window"
    | "ready";
  selection: {
    body: string;
    channel: NotificationChannel;
    subject: string;
    template: NotificationTemplateRow;
  } | null;
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function sortTasksByOrder(tasks: TaskRow[]) {
  return [...tasks].sort((left, right) => left.order - right.order);
}

function getTimeZoneParts(value: Date | string, timeZone: string) {
  const date = asDate(value);
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const entries = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: Number(entries.day),
    hour: Number(entries.hour),
    minute: Number(entries.minute),
    month: Number(entries.month),
    year: Number(entries.year),
  };
}

export function getDateKeyInTimeZone(value: Date | string, timeZone: string) {
  const parts = getTimeZoneParts(value, timeZone);

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0",
  )}-${String(parts.day).padStart(2, "0")}`;
}

function toDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function differenceInCalendarDays(
  later: Date | string,
  earlier: Date | string,
  timeZone: string,
) {
  return (
    toDayNumber(getDateKeyInTimeZone(later, timeZone)) -
    toDayNumber(getDateKeyInTimeZone(earlier, timeZone))
  );
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function parseClockValue(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function getMinutesInTimeZone(value: Date | string, timeZone: string) {
  const parts = getTimeZoneParts(value, timeZone);

  return parts.hour * 60 + parts.minute;
}

export function normalizeNotificationPreferences(
  value: Json | null | undefined,
): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      channels: [...DEFAULT_NOTIFICATION_PREFERENCES.channels],
    };
  }

  const source = value as Record<string, Json | undefined>;
  const channels = Array.isArray(source.channels)
    ? source.channels.filter(
        (channel): channel is NotificationChannel =>
          typeof channel === "string" &&
          (NOTIFICATION_CHANNELS as readonly string[]).includes(channel),
      )
    : [...DEFAULT_NOTIFICATION_PREFERENCES.channels];

  return {
    channels: channels.length > 0 ? channels : [...DEFAULT_NOTIFICATION_PREFERENCES.channels],
    quiet_end:
      typeof source.quiet_end === "string"
        ? source.quiet_end
        : DEFAULT_NOTIFICATION_PREFERENCES.quiet_end,
    quiet_start:
      typeof source.quiet_start === "string"
        ? source.quiet_start
        : DEFAULT_NOTIFICATION_PREFERENCES.quiet_start,
    timezone:
      typeof source.timezone === "string"
        ? source.timezone
        : DEFAULT_NOTIFICATION_PREFERENCES.timezone,
  };
}

export function isWithinNotificationWindow(
  value: Date | string,
  preferences: NotificationPreferences,
) {
  const minutes = getMinutesInTimeZone(value, preferences.timezone);
  const quietStart = parseClockValue(preferences.quiet_start);
  const quietEnd = parseClockValue(preferences.quiet_end);

  if (quietStart === quietEnd) {
    return true;
  }

  if (quietStart > quietEnd) {
    return !(minutes >= quietStart || minutes < quietEnd);
  }

  return !(minutes >= quietStart && minutes < quietEnd);
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

export function isTaskPaywalled(order: number, paymentStatus: PaymentStatus) {
  return order > FREE_TASK_LIMIT && paymentStatus !== "paid";
}

function getTaskTotalDays(task: TaskRow, progress: UserProgressRow | null) {
  return task.default_duration_days + (progress?.extended_days ?? 0);
}

function formatTaskSubtitle(task: TaskRow, progress: UserProgressRow | null) {
  const totalDays = getTaskTotalDays(task, progress);

  if (totalDays <= 1) {
    return null;
  }

  return `Day ${progress?.current_day ?? 1} of ${totalDays}`;
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

function selectDueReviewTask(
  reviewStates: SpacedRepetitionRow[],
  tasks: TaskRow[],
  activeTaskId: string | null,
  now: string,
  timeZone: string,
) {
  const todayKey = getDateKeyInTimeZone(now, timeZone);
  const dueState = [...reviewStates]
    .filter(
      (state) =>
        state.task_id !== activeTaskId &&
        state.next_review_date !== null &&
        state.next_review_date <= todayKey,
    )
    .sort((left, right) => String(left.next_review_date).localeCompare(String(right.next_review_date)))[0];

  if (!dueState) {
    return null;
  }

  const task = tasks.find((candidate) => candidate.id === dueState.task_id);

  if (!task) {
    return null;
  }

  return {
    dueDate: dueState.next_review_date ?? todayKey,
    task,
  };
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

    return progress?.status !== "completed";
  });

  if (!firstIncompleteTask) {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  const incompleteProgress = progressByTaskId.get(firstIncompleteTask.id);

  if (!incompleteProgress) {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  if (incompleteProgress.status === "active") {
    return {
      nextUnlockDate: null,
      updatedProgress: progressRows,
    };
  }

  if (firstIncompleteTask.order === 1) {
    incompleteProgress.status = "active";
    incompleteProgress.unlocked_at = incompleteProgress.unlocked_at ?? now;

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

  incompleteProgress.status = "active";
  incompleteProgress.unlocked_at = incompleteProgress.unlocked_at ?? now;

  return {
    nextUnlockDate: null,
    updatedProgress: progressRows,
  };
}

function getLatestCheckInForTask(checkIns: CheckInRow[], taskId: string) {
  return [...checkIns]
    .filter((checkIn) => checkIn.task_id === taskId)
    .sort((left, right) => right.checked_in_at.localeCompare(left.checked_in_at))[0]
    ?.checked_in_at ?? null;
}

export function buildJourneyState(args: {
  checkIns: CheckInRow[];
  now?: string;
  paymentStatus: PaymentStatus;
  profile: ProfileRow;
  progressRows: UserProgressRow[];
  reviewStates: SpacedRepetitionRow[];
  tasks: TaskRow[];
}) {
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(
    args.profile.notification_preferences,
  );
  const sortedTasks = sortTasksByOrder(args.tasks);
  const progressRows = args.progressRows.map((row) => ({ ...row }));
  const activation = resolveInactiveTask(
    sortedTasks,
    progressRows,
    preferences.timezone,
    args.paymentStatus,
    now,
  );
  const progressByTaskId = new Map(
    activation.updatedProgress.map((row) => [row.task_id, row]),
  );
  const currentProgress =
    activation.updatedProgress.find((row) => row.status === "active") ?? null;
  const taskStates = sortedTasks.map((task) => {
    const progress = progressByTaskId.get(task.id) ?? null;
    const status = progress?.status ?? "locked";
    const isPaywalled = isTaskPaywalled(task.order, args.paymentStatus);

    return {
      canOpen: status !== "locked" && !isPaywalled,
      currentDay: progress?.current_day ?? 1,
      isActive: status === "active",
      isCompleted: status === "completed",
      isLocked: status === "locked",
      isPaywalled,
      lastCheckInAt: getLatestCheckInForTask(args.checkIns, task.id),
      status,
      subtitle: formatTaskSubtitle(task, progress),
      task,
      totalDays: getTaskTotalDays(task, progress),
    };
  });
  const currentTask = taskStates.find((task) => task.isActive) ?? null;
  const completedCount = taskStates.filter((task) => task.isCompleted).length;
  const firstIncompleteTask =
    taskStates.find((task) => !task.isCompleted) ?? null;
  const reviewTask = selectDueReviewTask(
    args.reviewStates,
    sortedTasks,
    currentProgress?.task_id ?? null,
    now,
    preferences.timezone,
  );

  return {
    state: {
      activeTaskOrder: currentTask?.task.order ?? null,
      completedCount,
      currentTask: currentTask
        ? {
            currentDay: currentTask.currentDay,
            subtitle: currentTask.subtitle,
            task: currentTask.task,
            totalDays: currentTask.totalDays,
          }
        : null,
      isPostCompletion: completedCount === sortedTasks.length,
      motivatingAnswer: args.profile.motivating_answer,
      nextUnlockDate: activation.nextUnlockDate,
      reviewTask,
      showPaywall:
        args.paymentStatus !== "paid" &&
        firstIncompleteTask?.task.order === FREE_TASK_LIMIT + 1 &&
        activation.nextUnlockDate === null &&
        !firstIncompleteTask.isCompleted,
      streakCount: calculateStreak(args.checkIns, preferences.timezone, now),
      tasks: taskStates,
    } satisfies JourneyState,
    updatedProgress: activation.updatedProgress,
  };
}

function getExtensionDays(rating: number, triedIt: boolean) {
  if (!triedIt || rating <= 1) {
    return 2;
  }

  if (rating <= 2) {
    return 1;
  }

  return 0;
}

export function calculateSpacedRepetitionSchedule(args: {
  checkedInAt: string;
  currentState?: SpacedRepetitionRow | null;
  inactiveDays?: number;
  taskId: string;
  timeZone: string;
  triedIt: boolean;
  userId: string;
  userJourneyId: string;
  userRating: number;
}) {
  const current = args.currentState;
  const baseInterval = 1;
  const easeFloor = 1.3;
  const decayMultiplier = 0.5;
  const struggleThreshold = 2;
  const easeFactor = current?.ease_factor ?? 2.5;
  const reviewCount = current?.review_count ?? 0;
  const previousInterval = current?.interval_days ?? baseInterval;
  const isStruggling =
    args.userRating <= struggleThreshold || args.triedIt === false;
  const nextEaseFactor = Math.max(
    easeFloor,
    Number(
      (
        easeFactor +
        (0.1 -
          (5 - args.userRating) * (0.08 + (5 - args.userRating) * 0.02))
      ).toFixed(2),
    ),
  );

  let intervalDays = baseInterval;

  if (reviewCount === 0) {
    intervalDays = baseInterval;
  } else if (reviewCount === 1) {
    intervalDays = Math.max(baseInterval + 1, previousInterval * 2);
  } else {
    intervalDays = previousInterval * nextEaseFactor;
  }

  if (isStruggling) {
    intervalDays = Math.max(baseInterval, previousInterval * decayMultiplier);
  }

  if ((args.inactiveDays ?? 0) >= 2) {
    intervalDays = Math.max(baseInterval, intervalDays * decayMultiplier);
  }

  const normalizedInterval = Math.max(1, Math.round(intervalDays * 10) / 10);

  return {
    extensionDays: getExtensionDays(args.userRating, args.triedIt),
    isStruggling,
    nextState: {
      ease_factor: nextEaseFactor,
      interval_days: normalizedInterval,
      journey_id: args.userJourneyId,
      last_review_rating: args.userRating,
      next_review_date: addDaysToDateKey(
        getDateKeyInTimeZone(args.checkedInAt, args.timeZone),
        Math.max(1, Math.ceil(normalizedInterval)),
      ),
      review_count: reviewCount + 1,
      task_id: args.taskId,
      user_id: args.userId,
    } satisfies SpacedRepetitionInsert,
  };
}

function normalizePromptResponses(
  value: Record<string, string | undefined> | null | undefined,
) {
  if (!value) {
    return null;
  }

  const nextValue = Object.fromEntries(
    Object.entries(value).filter(
      ([, field]) => typeof field === "string" && field.trim().length > 0,
    ),
  );

  return Object.keys(nextValue).length > 0 ? nextValue : null;
}

export function processCheckIn(args: {
  checkIns: CheckInRow[];
  input: CompletionInput;
  now?: string;
  paymentStatus: PaymentStatus;
  profile: ProfileRow;
  progressRows: UserProgressRow[];
  reviewState?: SpacedRepetitionRow | null;
  task: TaskRow;
  tasks: TaskRow[];
}) {
  const checkedInAt = args.input.checkedInAt ?? args.now ?? new Date().toISOString();
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(
    args.profile.notification_preferences,
  );
  const currentProgress = args.progressRows.find((row) => row.task_id === args.task.id);

  if (!currentProgress) {
    throw new Error("User progress for the task was not found.");
  }

  if (currentProgress.status !== "active" && (args.input.type ?? "completion") === "completion") {
    throw new Error("Only the active task can be checked in.");
  }

  if (args.input.quickRating < 1 || args.input.quickRating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (args.input.timeSpentSeconds < 0) {
    throw new Error("Time spent must be 0 or greater.");
  }

  const type = args.input.type ?? "completion";

  if (type === "reinforcement_review") {
    const nextReview = calculateSpacedRepetitionSchedule({
      checkedInAt,
      currentState: args.reviewState,
      inactiveDays: 0,
      taskId: args.task.id,
      timeZone: preferences.timezone,
      triedIt: args.input.triedIt,
      userId: args.profile.id,
      userJourneyId: currentProgress.journey_id,
      userRating: args.input.quickRating,
    });

    return {
      activatedTaskId: null,
      checkIn: {
        checked_in_at: checkedInAt,
        journey_id: currentProgress.journey_id,
        prompt_responses: normalizePromptResponses(args.input.promptResponses),
        quick_rating: args.input.quickRating,
        task_id: args.task.id,
        time_spent_seconds: args.input.timeSpentSeconds,
        tried_it: args.input.triedIt,
        type: "reinforcement_review",
        user_id: args.profile.id,
      } satisfies CheckInInsert,
      nextUnlockDate: null,
      progress: args.progressRows,
      reason: "review_recorded",
      spacedRepetition: nextReview.nextState,
    };
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
  const nextReview = calculateSpacedRepetitionSchedule({
    checkedInAt,
    currentState: args.reviewState,
    inactiveDays,
    taskId: args.task.id,
    timeZone: preferences.timezone,
    triedIt: args.input.triedIt,
    userId: args.profile.id,
    userJourneyId: currentProgress.journey_id,
    userRating: args.input.quickRating,
  });
  const progressRows = args.progressRows.map((row) => ({ ...row }));
  const progress = progressRows.find((row) => row.task_id === args.task.id);

  if (!progress) {
    throw new Error("User progress for the task was not found.");
  }

  const totalDaysBefore = getTaskTotalDays(args.task, progress);
  const nextExtendedDays = Math.max(progress.extended_days, nextReview.extensionDays);
  const totalDaysAfter = args.task.default_duration_days + nextExtendedDays;
  const nextTaskDay = progress.current_day + 1;
  const checkIn = {
    checked_in_at: checkedInAt,
    journey_id: progress.journey_id,
    prompt_responses: normalizePromptResponses(args.input.promptResponses),
    quick_rating: args.input.quickRating,
    task_id: args.task.id,
    time_spent_seconds: args.input.timeSpentSeconds,
    tried_it: args.input.triedIt,
    type: "completion",
    user_id: args.profile.id,
  } satisfies CheckInInsert;

  if (nextTaskDay <= totalDaysAfter) {
    progress.current_day = nextTaskDay;
    progress.extended_days = nextExtendedDays;
    progress.extended_by_algorithm =
      nextExtendedDays > 0 || progress.extended_by_algorithm;

    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: addDaysToDateKey(
        getDateKeyInTimeZone(checkedInAt, preferences.timezone),
        1,
      ),
      progress: progressRows,
      reason:
        totalDaysAfter > totalDaysBefore ? "extended_task" : "continued_task",
      spacedRepetition: nextReview.nextState,
    };
  }

  progress.completed_at = checkedInAt;
  progress.status = "completed";
  const nextTask = args.tasks[args.tasks.findIndex((task) => task.id === args.task.id) + 1];

  if (!nextTask) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: progressRows,
      reason: "completed_journey",
      spacedRepetition: nextReview.nextState,
    };
  }

  if (isTaskPaywalled(nextTask.order, args.paymentStatus)) {
    return {
      activatedTaskId: null,
      checkIn,
      nextUnlockDate: null,
      progress: progressRows,
      reason: "paywall_blocked",
      spacedRepetition: nextReview.nextState,
    };
  }

  const gateOpened =
    differenceInCalendarDays(now, checkedInAt, preferences.timezone) >= 1;
  const nextProgress = progressRows.find((row) => row.task_id === nextTask.id);

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
      progress: progressRows,
      reason: "waiting_until_tomorrow",
      spacedRepetition: nextReview.nextState,
    };
  }

  nextProgress.status = "active";
  nextProgress.unlocked_at = now;

  return {
    activatedTaskId: nextTask.id,
    checkIn,
    nextUnlockDate: null,
    progress: progressRows,
    reason: "unlocked_next_task",
    spacedRepetition: nextReview.nextState,
  };
}

function interpolate(value: string, context: NotificationContext) {
  return value
    .replaceAll("{{task_title}}", context.taskTitle)
    .replaceAll("{{streak}}", String(context.streak))
    .replaceAll("{{day_number}}", String(context.dayNumber))
    .replaceAll("{{user_name}}", context.userName ?? "there");
}

export function selectNotificationChannel(
  history: Array<{ channel: NotificationChannel; sentAt: string }>,
  preferences: NotificationPreferences,
) {
  const channels =
    preferences.channels.length > 0
      ? preferences.channels
      : [...DEFAULT_NOTIFICATION_PREFERENCES.channels];

  if (channels.length === 0) {
    return null;
  }

  if (channels.length === 1) {
    return channels[0];
  }

  const latest = [...history].sort((left, right) =>
    right.sentAt.localeCompare(left.sentAt),
  )[0];

  if (!latest || !channels.includes(latest.channel)) {
    return channels[0];
  }

  const index = channels.indexOf(latest.channel);

  return channels[(index + 1) % channels.length] ?? channels[0];
}

export function selectNotificationTemplate(args: {
  channel: NotificationChannel;
  history: Array<{ sentAt: string; templateId: string | null; toneTag: string | null }>;
  now: string;
  templates: NotificationTemplateRow[];
}) {
  const channelTemplates = args.templates.filter(
    (template) => template.channel === args.channel && template.is_active,
  );

  if (channelTemplates.length === 0) {
    return null;
  }

  const sortedHistory = [...args.history].sort((left, right) =>
    right.sentAt.localeCompare(left.sentAt),
  );
  const today = new Date(args.now);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);
  const lastTone = sortedHistory[0]?.toneTag ?? null;
  const recentTemplateIds = new Set(
    sortedHistory
      .filter((item) => new Date(item.sentAt) >= sevenDaysAgo && item.templateId)
      .map((item) => item.templateId),
  );
  const toneFiltered = channelTemplates.filter(
    (template) => template.tone_tag !== lastTone,
  );
  const withoutRecentReuse = (toneFiltered.length > 0 ? toneFiltered : channelTemplates).filter(
    (template) => !recentTemplateIds.has(template.id),
  );
  const candidates =
    withoutRecentReuse.length > 0
      ? withoutRecentReuse
      : toneFiltered.length > 0
        ? toneFiltered
        : channelTemplates;

  return [...candidates].sort((left, right) => left.id.localeCompare(right.id))[0] ?? null;
}

export function buildNotificationDecision(args: {
  context: NotificationContext;
  history: Array<{
    channel: NotificationChannel;
    sentAt: string;
    templateId: string | null;
    toneTag: string | null;
  }>;
  now?: string;
  preferences: NotificationPreferences;
  templates: NotificationTemplateRow[];
}) {
  const now = args.now ?? new Date().toISOString();
  const sentToday = args.history.some(
    (item) =>
      getDateKeyInTimeZone(item.sentAt, args.preferences.timezone) ===
      getDateKeyInTimeZone(now, args.preferences.timezone),
  );

  if (sentToday) {
    return {
      channel: null,
      reason: "already_sent_today",
      selection: null,
    } satisfies NotificationDecision;
  }

  if (!isWithinNotificationWindow(now, args.preferences)) {
    return {
      channel: null,
      reason: "outside_window",
      selection: null,
    } satisfies NotificationDecision;
  }

  const channel = selectNotificationChannel(args.history, args.preferences);

  if (!channel) {
    return {
      channel: null,
      reason: "missing_channel",
      selection: null,
    } satisfies NotificationDecision;
  }

  const template = selectNotificationTemplate({
    channel,
    history: args.history,
    now,
    templates: args.templates,
  });

  if (!template) {
    return {
      channel,
      reason: "missing_template",
      selection: null,
    } satisfies NotificationDecision;
  }

  return {
    channel,
    reason: "ready",
    selection: {
      body: interpolate(template.body, args.context),
      channel,
      subject: interpolate(template.subject, args.context),
      template,
    },
  } satisfies NotificationDecision;
}
