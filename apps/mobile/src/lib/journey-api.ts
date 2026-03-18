import {
  buildJourneyState,
  calculateSpacedRepetitionSchedule,
  createInitialJourneyProgress,
  DEFAULT_JOURNEY_ID,
  processCompletionCheckIn,
  type CheckInRow,
  type CompletionCheckInInput,
  type JourneyState,
  type ProfileRow,
  type SpacedRepetitionStateRow,
  type TaskRow,
  type UserProgressRow,
} from "@focuslab/shared";

import { fetchProfile } from "./profile";
import { supabase } from "./supabase";

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

export async function fetchJourneyState() {
  try {
    const { data, error } = await supabase.functions.invoke("get-journey-state");

    if (error || !data?.state) {
      throw error ?? new Error("Journey function response was empty.");
    }

    return data.state as JourneyState;
  } catch {
    return fallbackFetchJourneyState();
  }
}

async function fallbackSubmitCompletionCheckIn(
  taskId: string,
  input: CompletionCheckInInput,
) {
  const userId = await getCurrentUserId();
  const profile = await fetchProfile(userId);
  const tasks = await fetchTasks();
  const progressRows = await ensureJourneyProgress(profile, tasks);
  const [checkIns, reviewStates] = await Promise.all([
    fetchCheckIns(profile.id),
    fetchReviewStates(profile),
  ]);
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const reviewState =
    reviewStates.find((state) => state.task_id === taskId) ?? null;
  const transition = processCompletionCheckIn({
    checkIns,
    input,
    paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
    profile,
    progressRows,
    reviewState,
    task,
    tasks,
  });

  const [{ error: checkInError }, { error: progressError }, { error: reviewError }] =
    await Promise.all([
      supabase.from("check_ins").insert(transition.checkIn),
      supabase.from("user_progress").upsert(transition.progress),
      supabase.from("spaced_repetition_state").upsert(transition.spacedRepetition),
    ]);

  if (checkInError) {
    throw checkInError;
  }

  if (progressError) {
    throw progressError;
  }

  if (reviewError) {
    throw reviewError;
  }

  return fetchJourneyState();
}

export async function submitCompletionCheckIn(
  taskId: string,
  input: CompletionCheckInInput,
) {
  try {
    const { data, error } = await supabase.functions.invoke("complete-check-in", {
      body: {
        checkedInAt: input.checkedInAt,
        promptResponses: input.promptResponses,
        quickRating: input.quickRating,
        taskId,
        timeSpentSeconds: input.timeSpentSeconds,
        triedIt: input.triedIt,
      },
    });

    if (error || !data?.state) {
      throw error ?? new Error("Check-in function response was empty.");
    }

    return data.state as JourneyState;
  } catch {
    return fallbackSubmitCompletionCheckIn(taskId, input);
  }
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
