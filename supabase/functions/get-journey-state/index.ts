import {
  buildJourneyState,
  createInitialJourneyProgress,
  DEFAULT_JOURNEY_ID,
  type UserProgressRow,
} from "../_shared/domain.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { requireAuthenticatedProfile } from "../_shared/auth.ts";

function hasProgressChanges(originalRows: UserProgressRow[], updatedRows: UserProgressRow[]) {
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

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const { profile, service } = await requireAuthenticatedProfile(request);
    const { data: tasks, error: tasksError } = await service
      .from("tasks")
      .select("*")
      .eq("journey_id", DEFAULT_JOURNEY_ID)
      .eq("is_active", true)
      .order("order");

    if (tasksError || !tasks) {
      throw tasksError ?? new Error("Tasks could not be loaded.");
    }

    const { data: existingProgress, error: progressError } = await service
      .from("user_progress")
      .select("*")
      .eq("user_id", profile.id)
      .eq("journey_id", profile.current_journey_id)
      .order("task_id");

    if (progressError) {
      throw progressError;
    }

    let progressRows: UserProgressRow[] = existingProgress ?? [];

    if (progressRows.length === 0) {
      const { data: insertedProgress, error: insertError } = await service
        .from("user_progress")
        .insert(
          createInitialJourneyProgress(tasks, profile.id, profile.current_journey_id),
        )
        .select("*");

      if (insertError || !insertedProgress) {
        throw insertError ?? new Error("Journey progress could not be initialized.");
      }

      progressRows = insertedProgress;
    }

    const [{ data: checkIns, error: checkInsError }, { data: reviewStates, error: reviewError }] =
      await Promise.all([
        service
          .from("check_ins")
          .select("*")
          .eq("user_id", profile.id)
          .order("checked_in_at", { ascending: false }),
        service
          .from("spaced_repetition_state")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id),
      ]);

    if (checkInsError) {
      throw checkInsError;
    }

    if (reviewError) {
      throw reviewError;
    }

    const { state, updatedProgress } = buildJourneyState({
      checkIns: checkIns ?? [],
      paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
      profile,
      progressRows,
      reviewStates: reviewStates ?? [],
      tasks,
    });

    if (hasProgressChanges(progressRows, updatedProgress)) {
      const { error: persistError } = await service
        .from("user_progress")
        .upsert(updatedProgress);

      if (persistError) {
        throw persistError;
      }
    }

    await service
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", profile.id);

    return jsonResponse({
      state,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
