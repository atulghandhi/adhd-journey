import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { requireAdminProfile } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);

  if (cors) {
    return cors;
  }

  try {
    const { service } = await requireAdminProfile(request);
    const [
      { data: profiles, error: profilesError },
      { data: tasks, error: tasksError },
      { data: progressRows, error: progressError },
      { data: posts, error: postsError },
      { data: reports, error: reportsError },
      { data: notifications, error: notificationsError },
    ] = await Promise.all([
      service.from("profiles").select("*"),
      service.from("tasks").select("id,title,order").order("order"),
      service.from("user_progress").select("user_id,task_id,status"),
      service.from("community_posts").select("id,task_id,is_hidden"),
      service.from("community_reports").select("id,post_id"),
      service.from("notification_log").select("id,opened_at"),
    ]);

    if (profilesError || !profiles) {
      throw profilesError ?? new Error("Profiles could not be loaded.");
    }

    if (tasksError || !tasks) {
      throw tasksError ?? new Error("Tasks could not be loaded.");
    }

    if (progressError || !progressRows) {
      throw progressError ?? new Error("Progress rows could not be loaded.");
    }

    if (postsError || !posts) {
      throw postsError ?? new Error("Community posts could not be loaded.");
    }

    if (reportsError || !reports) {
      throw reportsError ?? new Error("Community reports could not be loaded.");
    }

    if (notificationsError || !notifications) {
      throw notificationsError ?? new Error("Notification log could not be loaded.");
    }

    const totalUsers = profiles.length;
    const completedByUser = progressRows.reduce<Record<string, number>>(
      (counts, row) => {
        if (row.status === "completed") {
          counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
        }

        return counts;
      },
      {},
    );
    const completedJourneyUsers = Object.values(completedByUser).filter(
      (count) => count >= 30,
    ).length;
    const completionRate =
      totalUsers === 0
        ? 0
        : Math.round((completedJourneyUsers / totalUsers) * 100);
    const dropOff = tasks.map((task) => ({
      completedUsers: new Set(
        progressRows
          .filter((row) => row.task_id === task.id && row.status === "completed")
          .map((row) => row.user_id),
      ).size,
      order: task.order,
      title: task.title,
    }));
    const postCounts = posts.reduce<Record<string, number>>((counts, post) => {
      counts[post.task_id] = (counts[post.task_id] ?? 0) + 1;

      return counts;
    }, {});
    const popularThreads = tasks
      .map((task) => ({
        order: task.order,
        posts: postCounts[task.id] ?? 0,
        title: task.title,
      }))
      .sort((left, right) => right.posts - left.posts)
      .slice(0, 5);
    const notificationOpenRate =
      notifications.length === 0
        ? 0
        : Math.round(
            (notifications.filter((item) => item.opened_at !== null).length /
              notifications.length) *
              100,
          );

    return jsonResponse({
      activeUserCount: totalUsers,
      completionRate,
      completedJourneyUsers,
      dropOff,
      notificationOpenRate,
      popularThreads,
      reportedPostCount: reports.length,
      hiddenPostCount: posts.filter((post) => post.is_hidden).length,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
