import {
  buildJourneyState,
  buildRestartJourneyPayload,
  calculateStreak,
  createInitialJourneyProgress,
  hasPersistentThreadAccess,
  processCompletionCheckIn,
} from "../progression";

const makeTask = (order: number) => ({
  created_at: "2026-03-17T00:00:00.000Z",
  deeper_reading: null,
  default_duration_days: 1,
  difficulty_rating: 3,
  explanation_body: `Explanation ${order}`,
  id: `task-${order}`,
  is_active: true,
  journey_id: "journey-1",
  order,
  tags: [],
  task_body: `Task ${order}`,
  title: `Day ${order}`,
  updated_at: "2026-03-17T00:00:00.000Z",
});

describe("journey progression helpers", () => {
  const tasks = [1, 2, 15, 16].map(makeTask);
  const task1 = tasks[0]!;
  const task2 = tasks[1]!;
  const task15 = tasks[2]!;
  const task16 = tasks[3]!;
  const baseProfile = {
    avatar_url: null,
    created_at: "2026-03-17T00:00:00.000Z",
    current_journey_id: "journey-1",
    id: "user-1",
    last_active_at: "2026-03-17T00:00:00.000Z",
    motivating_answer: "Write a book",
    name: "Ari",
    notification_preferences: {
      channels: ["push", "email"],
      quiet_end: "08:00",
      quiet_start: "21:00",
      timezone: "Europe/London",
    },
    onboarding_complete: true,
    payment_receipt: null,
    payment_status: "free",
    role: "user",
    theme_preference: "light",
  };

  it("creates initial progress with the first task active", () => {
    const progress = createInitialJourneyProgress(tasks, "user-1", "journey-1");

    expect(progress[0]?.status).toBe("active");
    expect(progress[1]?.status).toBe("locked");
  });

  it("calculates a consecutive streak across calendar days", () => {
    const streak = calculateStreak(
      [
        {
          checked_in_at: "2026-03-16T20:00:00.000Z",
          created_at: "2026-03-16T20:00:00.000Z",
          id: "c1",
          journey_id: "journey-1",
          prompt_responses: null,
          quick_rating: 4,
          task_id: "task-1",
          time_spent_seconds: 120,
          tried_it: true,
          type: "completion",
          user_id: "user-1",
        },
        {
          checked_in_at: "2026-03-17T07:00:00.000Z",
          created_at: "2026-03-17T07:00:00.000Z",
          id: "c2",
          journey_id: "journey-1",
          prompt_responses: null,
          quick_rating: 4,
          task_id: "task-2",
          time_spent_seconds: 120,
          tried_it: true,
          type: "completion",
          user_id: "user-1",
        },
      ],
      "Europe/London",
      "2026-03-17T12:00:00.000Z",
    );

    expect(streak).toBe(2);
  });

  it("resets the streak after a missed day", () => {
    const streak = calculateStreak(
      [
        {
          checked_in_at: "2026-03-14T20:00:00.000Z",
          created_at: "2026-03-14T20:00:00.000Z",
          id: "c1",
          journey_id: "journey-1",
          prompt_responses: null,
          quick_rating: 4,
          task_id: "task-1",
          time_spent_seconds: 120,
          tried_it: true,
          type: "completion",
          user_id: "user-1",
        },
      ],
      "Europe/London",
      "2026-03-17T12:00:00.000Z",
    );

    expect(streak).toBe(0);
  });

  it("activates the next task when the time gate has passed", () => {
    const progressRows = [
      {
        completed_at: "2026-03-16T08:00:00.000Z",
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p1",
        journey_id: "journey-1",
        status: "completed",
        task_id: "task-1",
        unlocked_at: "2026-03-15T08:00:00.000Z",
        user_id: "user-1",
      },
      {
        completed_at: null,
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p2",
        journey_id: "journey-1",
        status: "locked",
        task_id: "task-2",
        unlocked_at: null,
        user_id: "user-1",
      },
    ];
    const result = buildJourneyState({
      checkIns: [],
      now: "2026-03-17T12:00:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows,
      tasks: tasks.slice(0, 2),
    });

    expect(result.state.currentTask?.task.id).toBe("task-2");
    expect(result.updatedProgress[1]?.status).toBe("active");
  });

  it("exposes the next unlock date when the time gate has not passed", () => {
    const progressRows = [
      {
        completed_at: "2026-03-17T08:00:00.000Z",
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p1",
        journey_id: "journey-1",
        status: "completed",
        task_id: "task-1",
        unlocked_at: "2026-03-15T08:00:00.000Z",
        user_id: "user-1",
      },
      {
        completed_at: null,
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p2",
        journey_id: "journey-1",
        status: "locked",
        task_id: "task-2",
        unlocked_at: null,
        user_id: "user-1",
      },
    ];
    const result = buildJourneyState({
      checkIns: [],
      now: "2026-03-17T12:00:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows,
      tasks: tasks.slice(0, 2),
    });

    expect(result.state.currentTask).toBeNull();
    expect(result.state.nextUnlockDate).toBe("2026-03-18");
  });

  it("shows a paywall at task sixteen for free users", () => {
    const progressRows = [
      {
        completed_at: "2026-03-16T08:00:00.000Z",
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p1",
        journey_id: "journey-1",
        status: "completed",
        task_id: "task-15",
        unlocked_at: "2026-03-15T08:00:00.000Z",
        user_id: "user-1",
      },
      {
        completed_at: null,
        current_day: 1,
        extended_by_algorithm: false,
        extended_days: 0,
        id: "p2",
        journey_id: "journey-1",
        status: "locked",
        task_id: "task-16",
        unlocked_at: null,
        user_id: "user-1",
      },
    ];
    const result = buildJourneyState({
      checkIns: [],
      now: "2026-03-17T12:00:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows,
      tasks: [task15, task16],
    });

    expect(result.state.showPaywall).toBe(true);
    expect(result.state.currentTask).toBeNull();
  });

  it("extends a struggling task instead of completing it", () => {
    const transition = processCompletionCheckIn({
      checkIns: [],
      input: {
        quickRating: 1,
        timeSpentSeconds: 90,
        triedIt: false,
      },
      now: "2026-03-17T18:00:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows: [
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p1",
          journey_id: "journey-1",
          status: "active",
          task_id: "task-1",
          unlocked_at: "2026-03-17T08:00:00.000Z",
          user_id: "user-1",
        },
      ],
      task: task1,
      tasks: [task1],
    });

    expect(transition.reason).toBe("extended_task");
    expect(transition.progress[0]?.current_day).toBe(2);
    expect(transition.progress[0]?.extended_days).toBe(2);
  });

  it("waits until tomorrow to unlock the next task after a same-day completion", () => {
    const transition = processCompletionCheckIn({
      checkIns: [],
      input: {
        checkedInAt: "2026-03-17T09:00:00.000Z",
        quickRating: 4,
        timeSpentSeconds: 120,
        triedIt: true,
      },
      now: "2026-03-17T18:00:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows: [
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p1",
          journey_id: "journey-1",
          status: "active",
          task_id: "task-1",
          unlocked_at: "2026-03-17T08:00:00.000Z",
          user_id: "user-1",
        },
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p2",
          journey_id: "journey-1",
          status: "locked",
          task_id: "task-2",
          unlocked_at: null,
          user_id: "user-1",
        },
      ],
      task: task1,
      tasks: [task1, task2],
    });

    expect(transition.reason).toBe("waiting_until_tomorrow");
    expect(transition.nextUnlockDate).toBe("2026-03-18");
  });

  it("unlocks the next task immediately for an offline replay from yesterday", () => {
    const transition = processCompletionCheckIn({
      checkIns: [],
      input: {
        checkedInAt: "2026-03-16T23:50:00.000Z",
        quickRating: 4,
        timeSpentSeconds: 120,
        triedIt: true,
      },
      now: "2026-03-17T08:10:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows: [
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p1",
          journey_id: "journey-1",
          status: "active",
          task_id: "task-1",
          unlocked_at: "2026-03-16T08:00:00.000Z",
          user_id: "user-1",
        },
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p2",
          journey_id: "journey-1",
          status: "locked",
          task_id: "task-2",
          unlocked_at: null,
          user_id: "user-1",
        },
      ],
      task: task1,
      tasks: [task1, task2],
    });

    expect(transition.reason).toBe("unlocked_next_task");
    expect(transition.activatedTaskId).toBe("task-2");
  });

  it("blocks free users at the paywall when day fifteen is complete", () => {
    const transition = processCompletionCheckIn({
      checkIns: [],
      input: {
        checkedInAt: "2026-03-16T23:50:00.000Z",
        quickRating: 4,
        timeSpentSeconds: 120,
        triedIt: true,
      },
      now: "2026-03-17T08:10:00.000Z",
      paymentStatus: "free",
      profile: baseProfile,
      progressRows: [
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p1",
          journey_id: "journey-1",
          status: "active",
          task_id: "task-15",
          unlocked_at: "2026-03-16T08:00:00.000Z",
          user_id: "user-1",
        },
        {
          completed_at: null,
          current_day: 1,
          extended_by_algorithm: false,
          extended_days: 0,
          id: "p2",
          journey_id: "journey-1",
          status: "locked",
          task_id: "task-16",
          unlocked_at: null,
          user_id: "user-1",
        },
      ],
      task: task15,
      tasks: [task15, task16],
    });

    expect(transition.reason).toBe("paywall_blocked");
  });

  it("preserves old unlocks when checking community access across journeys", () => {
    expect(
      hasPersistentThreadAccess(
        [
          {
            completed_at: "2026-03-16T08:00:00.000Z",
            current_day: 1,
            extended_by_algorithm: false,
            extended_days: 0,
            id: "p1",
            journey_id: "journey-old",
            status: "completed",
            task_id: "task-2",
            unlocked_at: "2026-03-15T08:00:00.000Z",
            user_id: "user-1",
          },
          {
            completed_at: null,
            current_day: 1,
            extended_by_algorithm: false,
            extended_days: 0,
            id: "p2",
            journey_id: "journey-new",
            status: "locked",
            task_id: "task-2",
            unlocked_at: null,
            user_id: "user-1",
          },
        ],
        "task-2",
      ),
    ).toBe(true);
  });

  it("creates a fresh journey while keeping old journey ids intact", () => {
    const payload = buildRestartJourneyPayload({
      currentJourneyId: "journey-old",
      newJourneyId: "journey-new",
      tasks: [task1, task2],
      userId: "user-1",
    });

    expect(payload.profileUpdate.current_journey_id).toBe("journey-new");
    expect(payload.progress.every((row) => row.journey_id === "journey-new")).toBe(true);
  });
});
