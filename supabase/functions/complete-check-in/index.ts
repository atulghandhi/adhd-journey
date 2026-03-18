import {
  buildJourneyState,
  DEFAULT_JOURNEY_ID,
  processCheckIn,
} from "../_shared/domain.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { requireAuthenticatedProfile } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const { profile, service } = await requireAuthenticatedProfile(request);
    const payload = await request.json();
    const taskId = typeof payload.taskId === "string" ? payload.taskId : null;
    const type =
      payload.type === "reinforcement_review"
        ? "reinforcement_review"
        : "completion";

    if (!taskId) {
      throw new HttpError(400, "taskId is required.");
    }

    const [{ data: tasks, error: tasksError }, { data: progressRows, error: progressError }] =
      await Promise.all([
        service
          .from("tasks")
          .select("*")
          .eq("journey_id", DEFAULT_JOURNEY_ID)
          .eq("is_active", true)
          .order("order"),
        service
          .from("user_progress")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id),
      ]);

    if (tasksError || !tasks) {
      throw tasksError ?? new Error("Tasks could not be loaded.");
    }

    if (progressError || !progressRows) {
      throw progressError ?? new Error("Progress could not be loaded.");
    }

    const task = tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      throw new HttpError(404, "Task not found.");
    }

    const [{ data: checkIns, error: checkInsError }, { data: reviewState, error: reviewError }] =
      await Promise.all([
        service
          .from("check_ins")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id),
        service
          .from("spaced_repetition_state")
          .select("*")
          .eq("user_id", profile.id)
          .eq("journey_id", profile.current_journey_id)
          .eq("task_id", taskId)
          .maybeSingle(),
      ]);

    if (checkInsError) {
      throw checkInsError;
    }

    if (reviewError) {
      throw reviewError;
    }

    const transition = processCheckIn({
      checkIns: checkIns ?? [],
      input: {
        checkedInAt:
          typeof payload.checkedInAt === "string" ? payload.checkedInAt : undefined,
        promptResponses:
          payload.promptResponses && typeof payload.promptResponses === "object"
            ? payload.promptResponses
            : null,
        quickRating: Number(payload.quickRating),
        taskId,
        timeSpentSeconds: Number(payload.timeSpentSeconds ?? 0),
        triedIt: Boolean(payload.triedIt),
        type,
      },
      paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
      profile,
      progressRows,
      reviewState: reviewState ?? null,
      task,
      tasks,
    });

    const [{ error: checkInInsertError }, { error: progressPersistError }, { error: reviewPersistError }] =
      await Promise.all([
        service.from("check_ins").insert(transition.checkIn),
        service.from("user_progress").upsert(transition.progress),
        service
          .from("spaced_repetition_state")
          .upsert(transition.spacedRepetition),
      ]);

    if (checkInInsertError) {
      throw checkInInsertError;
    }

    if (progressPersistError) {
      throw progressPersistError;
    }

    if (reviewPersistError) {
      throw reviewPersistError;
    }

    const refreshedCheckIns = [...(checkIns ?? []), {
      checked_in_at: transition.checkIn.checked_in_at ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
      id: crypto.randomUUID(),
      journey_id: transition.checkIn.journey_id ?? profile.current_journey_id,
      prompt_responses: transition.checkIn.prompt_responses ?? null,
      quick_rating: transition.checkIn.quick_rating,
      task_id: transition.checkIn.task_id,
      time_spent_seconds: transition.checkIn.time_spent_seconds ?? 0,
      tried_it: transition.checkIn.tried_it,
      type: transition.checkIn.type,
      user_id: transition.checkIn.user_id,
    }];
    const refreshedReviewStates = reviewState
      ? [
          ...((await service
            .from("spaced_repetition_state")
            .select("*")
            .eq("user_id", profile.id)
            .eq("journey_id", profile.current_journey_id)).data ?? []),
        ]
      : [];
    const { state } = buildJourneyState({
      checkIns: refreshedCheckIns,
      paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
      profile,
      progressRows: transition.progress,
      reviewStates:
        refreshedReviewStates.length > 0
          ? refreshedReviewStates
          : [{
              ...transition.spacedRepetition,
              id: crypto.randomUUID(),
            }],
      tasks,
    });

    return jsonResponse({
      state,
      transition: {
        activatedTaskId: transition.activatedTaskId,
        nextUnlockDate: transition.nextUnlockDate,
        reason: transition.reason,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
