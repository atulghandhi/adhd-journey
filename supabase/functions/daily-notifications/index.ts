import {
  buildJourneyState,
  buildNotificationDecision,
  DEFAULT_JOURNEY_ID,
  normalizeNotificationPreferences,
} from "../_shared/domain.ts";
import { handleCors } from "../_shared/cors.ts";
import { sendEmailNotification, sendPushNotification } from "../_shared/external.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const service = createServiceClient();
    const [{ data: profiles, error: profilesError }, { data: templates, error: templatesError }, { data: tasks, error: tasksError }] =
      await Promise.all([
        service.from("profiles").select("*"),
        service.from("notification_templates").select("*").eq("is_active", true),
        service
          .from("tasks")
          .select("*")
          .eq("journey_id", DEFAULT_JOURNEY_ID)
          .eq("is_active", true)
          .order("order"),
      ]);

    if (profilesError || !profiles) {
      throw profilesError ?? new Error("Profiles could not be loaded.");
    }

    if (templatesError || !templates) {
      throw templatesError ?? new Error("Templates could not be loaded.");
    }

    if (tasksError || !tasks) {
      throw tasksError ?? new Error("Tasks could not be loaded.");
    }

    const summary = [];

    for (const profile of profiles) {
      const preferences = normalizeNotificationPreferences(
        profile.notification_preferences,
      );
      const [{ data: progressRows }, { data: checkIns }, { data: reviewStates }, { data: logs }, { data: pushTokens }] =
        await Promise.all([
          service
            .from("user_progress")
            .select("*")
            .eq("user_id", profile.id)
            .eq("journey_id", profile.current_journey_id),
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
          service
            .from("notification_log")
            .select("channel,sent_at,template_id,notification_templates(tone_tag)")
            .eq("user_id", profile.id)
            .order("sent_at", { ascending: false })
            .limit(14),
          service
            .from("push_tokens")
            .select("*")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      if (!progressRows || progressRows.length === 0) {
        summary.push({
          reason: "no_progress",
          user_id: profile.id,
        });
        continue;
      }

      const { state } = buildJourneyState({
        checkIns: checkIns ?? [],
        paymentStatus: profile.payment_status === "paid" ? "paid" : "free",
        profile,
        progressRows,
        reviewStates: reviewStates ?? [],
        tasks,
      });
      const taskForNotification = state.reviewTask?.task ?? state.currentTask?.task ?? null;

      if (!taskForNotification) {
        summary.push({
          reason: "no_task_context",
          user_id: profile.id,
        });
        continue;
      }

      const decision = buildNotificationDecision({
        context: {
          dayNumber: taskForNotification.order,
          streak: state.streakCount,
          taskTitle: taskForNotification.title,
          userName: profile.name,
        },
        history: (logs ?? []).map((item) => ({
          channel: item.channel as "email" | "push",
          sentAt: item.sent_at,
          templateId: item.template_id,
          toneTag:
            Array.isArray(item.notification_templates)
              ? item.notification_templates[0]?.tone_tag ?? null
              : item.notification_templates?.tone_tag ?? null,
        })),
        preferences,
        templates,
      });

      if (decision.reason !== "ready" || !decision.selection) {
        summary.push({
          reason: decision.reason,
          user_id: profile.id,
        });
        continue;
      }

      let sendResult = {
        ok: true,
        stub: true,
      };

      if (decision.selection.channel === "push") {
        const token = pushTokens?.[0]?.token;

        if (!token) {
          summary.push({
            reason: "missing_push_token",
            user_id: profile.id,
          });
          continue;
        }

        sendResult = await sendPushNotification({
          body: decision.selection.body,
          title: decision.selection.subject,
          token,
          userId: profile.id,
        });
      } else {
        const { data: authUser } = await service.auth.admin.getUserById(profile.id);
        const email = authUser.user?.email;

        if (!email) {
          summary.push({
            reason: "missing_email",
            user_id: profile.id,
          });
          continue;
        }

        sendResult = await sendEmailNotification({
          html: decision.selection.body,
          subject: decision.selection.subject,
          to: email,
          userId: profile.id,
        });
      }

      await service.from("notification_log").insert({
        channel: decision.selection.channel,
        sent_at: new Date().toISOString(),
        template_id: decision.selection.template.id,
        user_id: profile.id,
      });

      summary.push({
        channel: decision.selection.channel,
        sent: sendResult.ok,
        stub: sendResult.stub,
        user_id: profile.id,
      });
    }

    return jsonResponse({
      notificationsProcessed: summary.length,
      summary,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
