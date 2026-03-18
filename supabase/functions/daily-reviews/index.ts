import {
  getDateKeyInTimeZone,
  normalizeNotificationPreferences,
} from "../_shared/domain.ts";
import { handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const service = createServiceClient();
    const [{ data: profiles, error: profilesError }, { data: reviewStates, error: reviewError }, { data: tasks, error: tasksError }] =
      await Promise.all([
        service.from("profiles").select("*"),
        service.from("spaced_repetition_state").select("*"),
        service.from("tasks").select("id,title,order"),
      ]);

    if (profilesError || !profiles) {
      throw profilesError ?? new Error("Profiles could not be loaded.");
    }

    if (reviewError || !reviewStates) {
      throw reviewError ?? new Error("Review states could not be loaded.");
    }

    if (tasksError || !tasks) {
      throw tasksError ?? new Error("Tasks could not be loaded.");
    }

    const dueReviews = profiles.flatMap((profile) => {
      const preferences = normalizeNotificationPreferences(
        profile.notification_preferences,
      );
      const todayKey = getDateKeyInTimeZone(new Date().toISOString(), preferences.timezone);

      return reviewStates
        .filter(
          (state) =>
            state.user_id === profile.id &&
            state.next_review_date !== null &&
            state.next_review_date <= todayKey,
        )
        .map((state) => ({
          next_review_date: state.next_review_date,
          task: tasks.find((task) => task.id === state.task_id) ?? null,
          user_id: profile.id,
        }));
    });

    return jsonResponse({
      dueReviewCount: dueReviews.length,
      dueReviews,
      updatedCount: 0,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
