import {
  buildJourneyState,
  calculateSpacedRepetitionSchedule,
  createInitialJourneyProgress,
  DEFAULT_JOURNEY_ID,
  processCompletionCheckIn,
  processSkipCheckIn,
  type CheckInInsert,
  type CheckInRow,
  type CompletionCheckInInput,
  type JourneyState,
  type ProfileRow,
  type SkipCheckInInput,
  type SpacedRepetitionStateInsert,
  type SpacedRepetitionStateRow,
  type TaskRow,
  type UserProgressRow,
} from "@focuslab/shared";

import { fetchProfile } from "./profile";
import { supabase } from "./supabase";

const EDGE_FN_TIMEOUT_MS = 12_000;

// Hermes (React Native's JS engine) does not expose a global `crypto`.
// We only need a unique-ish id for local optimistic state (the DB auto-
// generates real UUIDs via `gen_random_uuid()` defaults). This avoids a
// `ReferenceError: Property 'crypto' doesn't exist` crash in the fallback
// path.
function localId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
// Absolute ceiling for the whole submit/fetch flow (edge fn + fallback).
// The mutation button is tied to this; if anything stalls longer we'd
// rather surface an error than let the UI hang forever.
const TOTAL_FLOW_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[journey-api] ${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

function hasProgressChanges(
  originalRows: UserProgressRow[],
  updatedRows: UserProgressRow[],
) {
  const originalMap = new Map(
    originalRows.map((row) => [
      row.id,
      JSON.stringify({
        completed_at: row.completed_at,
        current_day: row.current_day,
        extended_by_algorithm: row.extended_by_algorithm,
        extended_days: row.extended_days,
        status: row.status,
        unlocked_at: row.unlocked_at,
      }),
    ]),
  );

  return updatedRows.some((row) => {
    const nextValue = JSON.stringify({
      completed_at: row.completed_at,
      current_day: row.current_day,
      extended_by_algorithm: row.extended_by_algorithm,
      extended_days: row.extended_days,
      status: row.status,
      unlocked_at: row.unlocked_at,
    });

    return originalMap.get(row.id) !== nextValue;
  });
}

function buildJourneyStateFromLocalTransition(args: {
  checkIn: CheckInInsert;
  checkIns: CheckInRow[];
  profile: ProfileRow;
  progressRows: UserProgressRow[];
  reviewStates: SpacedRepetitionStateRow[];
  spacedRepetition: SpacedRepetitionStateInsert | null;
  tasks: TaskRow[];
}) {
  const nextCheckIn: CheckInRow = {
    checked_in_at: args.checkIn.checked_in_at ?? new Date().toISOString(),
    created_at: new Date().toISOString(),
    id: localId(),
    journey_id: args.checkIn.journey_id ?? args.profile.current_journey_id,
    prompt_responses: args.checkIn.prompt_responses ?? null,
    quick_rating: args.checkIn.quick_rating,
    task_id: args.checkIn.task_id,
    time_spent_seconds: args.checkIn.time_spent_seconds ?? 0,
    tried_it: args.checkIn.tried_it,
    type: args.checkIn.type,
    user_id: args.checkIn.user_id,
  };
  const existingReviewState = args.spacedRepetition
    ? args.reviewStates.find((state) => state.task_id === args.spacedRepetition?.task_id) ?? null
    : null;
  const nextReviewStates = args.spacedRepetition
    ? [
        ...args.reviewStates.filter(
          (state) => state.task_id !== args.spacedRepetition?.task_id,
        ),
        {
          ease_factor: args.spacedRepetition.ease_factor ?? existingReviewState?.ease_factor ?? 2.5,
          id: args.spacedRepetition.id ?? existingReviewState?.id ?? localId(),
          interval_days:
            args.spacedRepetition.interval_days ?? existingReviewState?.interval_days ?? 1,
          journey_id:
            args.spacedRepetition.journey_id ??
            existingReviewState?.journey_id ??
            args.profile.current_journey_id,
          last_review_rating:
            args.spacedRepetition.last_review_rating ??
            existingReviewState?.last_review_rating ??
            null,
          next_review_date:
            args.spacedRepetition.next_review_date ??
            existingReviewState?.next_review_date ??
            null,
          review_count:
            args.spacedRepetition.review_count ?? existingReviewState?.review_count ?? 0,
          task_id: args.spacedRepetition.task_id,
          user_id: args.spacedRepetition.user_id,
        },
      ]
    : args.reviewStates;

  return buildJourneyState({
    checkIns: [nextCheckIn, ...args.checkIns],
    paymentStatus: args.profile.payment_status === "paid" ? "paid" : "free",
    profile: args.profile,
    progressRows: args.progressRows,
    reviewStates: nextReviewStates,
    tasks: args.tasks,
  }).state;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw error ?? new Error("You need to be signed in.");
  }

  return user.id;
}

async function fetchTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("journey_id", DEFAULT_JOURNEY_ID)
    .eq("is_active", true)
    .order("order");

  if (error || !data) {
    throw error ?? new Error("Tasks could not be loaded.");
  }

  return data as TaskRow[];
}

async function ensureJourneyProgress(profile: ProfileRow, tasks: TaskRow[]) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", profile.id)
    .eq("journey_id", profile.current_journey_id);

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    return data as UserProgressRow[];
  }

  const initialProgress = createInitialJourneyProgress(
    tasks,
    profile.id,
    profile.current_journey_id,
  );
  const { data: inserted, error: insertError } = await supabase
    .from("user_progress")
    .insert(initialProgress)
    .select("*");

  if (insertError || !inserted) {
    throw insertError ?? new Error("Journey progress could not be initialized.");
  }

  return inserted as UserProgressRow[];
}

async function fetchCheckIns(userId: string) {
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .order("checked_in_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CheckInRow[];
}

async function fetchReviewStates(profile: ProfileRow) {
  const { data, error } = await supabase
    .from("spaced_repetition_state")
    .select("*")
    .eq("user_id", profile.id)
    .eq("journey_id", profile.current_journey_id);

  if (error) {
    throw error;
  }

  return (data ?? []) as SpacedRepetitionStateRow[];
}

async function fallbackFetchJourneyState() {
  const userId = await getCurrentUserId();
  const profile = await fetchProfile(userId);
  const tasks = await fetchTasks();
  const progressRows = await ensureJourneyProgress(profile, tasks);
  const [checkIns, reviewStates] = await Promise.all([
    fetchCheckIns(profile.id),
    fetchReviewStates(profile),
  ]);
  const { state, updatedProgress } = buildJourneyState({
    checkIns,
    paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
    profile,
    progressRows,
    reviewStates,
    tasks,
  });

  if (hasProgressChanges(progressRows, updatedProgress)) {
    const { error } = await supabase.from("user_progress").upsert(updatedProgress);

    if (error) {
      throw error;
    }
  }

  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", profile.id);

  return state;
}

async function fetchJourneyStateInner() {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("get-journey-state"),
      EDGE_FN_TIMEOUT_MS,
      "get-journey-state invoke",
    );

    if (error || !data?.state) {
      throw error ?? new Error("Journey function response was empty.");
    }

    return data.state as JourneyState;
  } catch (edgeError) {
    console.warn("[journey-api] get-journey-state failed, using fallback:", edgeError);
    try {
      return await fallbackFetchJourneyState();
    } catch (fallbackError) {
      console.error("[journey-api] fallbackFetchJourneyState failed:", fallbackError);
      throw fallbackError;
    }
  }
}

export async function fetchJourneyState() {
  return withTimeout(
    fetchJourneyStateInner(),
    TOTAL_FLOW_TIMEOUT_MS,
    "fetchJourneyState total flow",
  );
}

async function fallbackSubmitCompletionCheckIn(
  taskId: string,
  input: CompletionCheckInInput,
) {
  console.log("[journey-api] fallback.submit: start", { taskId });
  const userId = await getCurrentUserId();
  console.log("[journey-api] fallback.submit: got userId", userId);
  const profile = await fetchProfile(userId);
  console.log("[journey-api] fallback.submit: got profile", profile.id);
  const tasks = await fetchTasks();
  console.log("[journey-api] fallback.submit: got tasks", tasks.length);
  const progressRows = await ensureJourneyProgress(profile, tasks);
  console.log("[journey-api] fallback.submit: got progress", progressRows.length);
  const [checkIns, reviewStates] = await Promise.all([
    fetchCheckIns(profile.id),
    fetchReviewStates(profile),
  ]);
  console.log("[journey-api] fallback.submit: got checkIns+reviewStates", checkIns.length, reviewStates.length);
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const reviewState =
    reviewStates.find((state) => state.task_id === taskId) ?? null;
  let transition;
  try {
    transition = processCompletionCheckIn({
      checkIns,
      input,
      paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
      profile,
      progressRows,
      reviewState,
      task,
      tasks,
    });
    console.log("[journey-api] fallback.submit: transition built", {
      checkInKeys: Object.keys(transition.checkIn ?? {}),
      progressCount: transition.progress?.length,
      srCount: transition.spacedRepetition ? 1 : 0,
    });
  } catch (transitionError) {
    console.error("[journey-api] fallback.submit: processCompletionCheckIn threw", transitionError);
    throw transitionError;
  }

  console.log("[journey-api] fallback.submit: writing inserts/upserts");
  const [{ error: checkInError }, { error: progressError }, { error: reviewError }] =
    await Promise.all([
      supabase.from("check_ins").insert(transition.checkIn),
      supabase.from("user_progress").upsert(transition.progress),
      supabase.from("spaced_repetition_state").upsert(transition.spacedRepetition),
    ]);
  console.log("[journey-api] fallback.submit: write results", {
    checkInError: checkInError?.message,
    progressError: progressError?.message,
    reviewError: reviewError?.message,
  });

  if (checkInError) {
    throw checkInError;
  }

  if (progressError) {
    throw progressError;
  }

  if (reviewError) {
    throw reviewError;
  }

  return buildJourneyStateFromLocalTransition({
    checkIn: transition.checkIn,
    checkIns,
    profile,
    progressRows: transition.progress,
    reviewStates,
    spacedRepetition: transition.spacedRepetition,
    tasks,
  });
}

async function submitCompletionCheckInInner(
  taskId: string,
  input: CompletionCheckInInput,
) {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("complete-check-in", {
        body: {
          checkedInAt: input.checkedInAt,
          promptResponses: input.promptResponses,
          quickRating: input.quickRating,
          taskId,
          timeSpentSeconds: input.timeSpentSeconds,
          triedIt: input.triedIt,
        },
      }),
      EDGE_FN_TIMEOUT_MS,
      "complete-check-in invoke",
    );

    if (error || !data?.state) {
      throw error ?? new Error("Check-in function response was empty.");
    }

    return data.state as JourneyState;
  } catch (edgeError) {
    console.warn("[journey-api] complete-check-in failed, using fallback:", edgeError);
    try {
      return await fallbackSubmitCompletionCheckIn(taskId, input);
    } catch (fallbackError) {
      console.error("[journey-api] fallbackSubmitCompletionCheckIn failed:", fallbackError);
      throw fallbackError;
    }
  }
}

export async function submitCompletionCheckIn(
  taskId: string,
  input: CompletionCheckInInput,
) {
  return withTimeout(
    submitCompletionCheckInInner(taskId, input),
    TOTAL_FLOW_TIMEOUT_MS,
    "submitCompletionCheckIn total flow",
  );
}

export async function submitReviewCheckIn(args: {
  quickRating: number;
  taskId: string;
  triedIt?: boolean;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("You need to be signed in.");
  }

  try {
    const { data, error } = await supabase.functions.invoke("complete-check-in", {
      body: {
        quickRating: args.quickRating,
        taskId: args.taskId,
        timeSpentSeconds: 0,
        triedIt: args.triedIt ?? true,
        type: "reinforcement_review",
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch {
    const profile = await fetchProfile(user.id);
    const [progressRows, reviewStates] = await Promise.all([
      ensureJourneyProgress(profile, await fetchTasks()),
      fetchReviewStates(profile),
    ]);
    const progress =
      progressRows.find((row) => row.task_id === args.taskId) ?? progressRows[0];
    const nextReview = calculateSpacedRepetitionSchedule({
      checkedInAt: new Date().toISOString(),
      currentState:
        reviewStates.find((state) => state.task_id === args.taskId) ?? null,
      taskId: args.taskId,
      timeZone:
        typeof (profile.notification_preferences as Record<string, unknown> | null)
          ?.timezone === "string"
          ? String(
              (profile.notification_preferences as Record<string, unknown>).timezone,
            )
          : "UTC",
      triedIt: args.triedIt ?? true,
      userId: profile.id,
      userJourneyId: progress?.journey_id ?? profile.current_journey_id,
      userRating: args.quickRating,
    });

    await Promise.all([
      supabase.from("check_ins").insert({
        quick_rating: args.quickRating,
        task_id: args.taskId,
        time_spent_seconds: 0,
        tried_it: args.triedIt ?? true,
        type: "reinforcement_review",
        user_id: profile.id,
        journey_id: progress?.journey_id ?? profile.current_journey_id,
      }),
      supabase.from("spaced_repetition_state").upsert(nextReview.nextState),
    ]);
  }
}

async function submitSkipCheckInInner(
  taskId: string,
  input: SkipCheckInInput,
) {
  console.log("[journey-api] skip.submit: start", { taskId });
  const userId = await getCurrentUserId();
  console.log("[journey-api] skip.submit: got userId", userId);
  const profile = await fetchProfile(userId);
  console.log("[journey-api] skip.submit: got profile", profile.id);
  const tasks = await fetchTasks();
  console.log("[journey-api] skip.submit: got tasks", tasks.length);
  const [progressRows, checkIns, reviewStates] = await Promise.all([
    ensureJourneyProgress(profile, tasks),
    fetchCheckIns(profile.id),
    fetchReviewStates(profile),
  ]);
  console.log("[journey-api] skip.submit: got state inputs", {
    checkIns: checkIns.length,
    progress: progressRows.length,
    reviewStates: reviewStates.length,
  });
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  let transition;
  try {
    transition = processSkipCheckIn({
      input,
      paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
      profile,
      progressRows,
      task,
      tasks,
    });
    console.log("[journey-api] skip.submit: transition built", {
      checkInType: transition.checkIn.type,
      progressCount: transition.progress.length,
      reason: transition.reason,
    });
  } catch (transitionError) {
    console.error("[journey-api] skip.submit: processSkipCheckIn threw", transitionError);
    throw transitionError;
  }

  console.log("[journey-api] skip.submit: writing inserts/upserts");
  const [{ error: checkInError }, { error: progressError }] = await Promise.all([
    supabase.from("check_ins").insert(transition.checkIn).select(),
    supabase.from("user_progress").upsert(transition.progress).select(),
  ]);
  console.log("[journey-api] skip.submit: write results", {
    checkInError: checkInError?.message,
    progressError: progressError?.message,
  });

  if (checkInError) {
    throw checkInError;
  }

  if (progressError) {
    throw progressError;
  }

  return buildJourneyStateFromLocalTransition({
    checkIn: transition.checkIn,
    checkIns,
    profile,
    progressRows: transition.progress,
    reviewStates,
    spacedRepetition: transition.spacedRepetition,
    tasks,
  });
}

export async function submitSkipCheckIn(
  taskId: string,
  input: SkipCheckInInput,
) {
  return withTimeout(
    submitSkipCheckInInner(taskId, input),
    TOTAL_FLOW_TIMEOUT_MS,
    "submitSkipCheckIn total flow",
  );
}
