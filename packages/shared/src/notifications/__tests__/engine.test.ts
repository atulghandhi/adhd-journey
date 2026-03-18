import {
  buildNotificationDecision,
  selectNotificationChannel,
  selectNotificationTemplate,
} from "../engine";

const templates = [
  {
    body: "Body {{task_title}}",
    channel: "push",
    created_at: "2026-03-17T00:00:00.000Z",
    id: "template-1",
    is_active: true,
    subject: "Push {{day_number}}",
    tone_tag: "encouraging",
  },
  {
    body: "Email {{user_name}}",
    channel: "email",
    created_at: "2026-03-17T00:00:00.000Z",
    id: "template-2",
    is_active: true,
    subject: "Email {{streak}}",
    tone_tag: "playful",
  },
  {
    body: "Alt push {{task_title}}",
    channel: "push",
    created_at: "2026-03-17T00:00:00.000Z",
    id: "template-3",
    is_active: true,
    subject: "Alt {{day_number}}",
    tone_tag: "direct",
  },
];

describe("notification engine", () => {
  it("rotates channels based on the latest send", () => {
    const channel = selectNotificationChannel([
      {
        channel: "push",
        sentAt: "2026-03-16T09:00:00.000Z",
        templateId: "template-1",
        toneTag: "encouraging",
      },
    ]);

    expect(channel).toBe("email");
  });

  it("sticks to the only configured channel", () => {
    const channel = selectNotificationChannel([], {
      channels: ["email"],
      quiet_end: "08:00",
      quiet_start: "21:00",
      timezone: "Europe/London",
    });

    expect(channel).toBe("email");
  });

  it("avoids reusing the same tone on back-to-back days", () => {
    const template = selectNotificationTemplate({
      channel: "push",
      history: [
        {
          channel: "push",
          sentAt: "2026-03-16T09:00:00.000Z",
          templateId: "template-1",
          toneTag: "encouraging",
        },
      ],
      now: "2026-03-17T09:00:00.000Z",
      templates,
    });

    expect(template?.id).toBe("template-3");
  });

  it("avoids reusing the same template within seven days when possible", () => {
    const template = selectNotificationTemplate({
      channel: "push",
      history: [
        {
          channel: "push",
          sentAt: "2026-03-15T09:00:00.000Z",
          templateId: "template-3",
          toneTag: "direct",
        },
      ],
      now: "2026-03-17T09:00:00.000Z",
      templates,
    });

    expect(template?.id).toBe("template-1");
  });

  it("skips when a notification was already sent today", () => {
    const result = buildNotificationDecision({
      context: {
        dayNumber: 4,
        streak: 3,
        taskTitle: "Time Log",
        userName: "Ari",
      },
      history: [
        {
          channel: "push",
          sentAt: "2026-03-17T09:00:00.000Z",
          templateId: "template-1",
          toneTag: "encouraging",
        },
      ],
      now: "2026-03-17T10:00:00.000Z",
      preferences: {
        channels: ["push", "email"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "Europe/London",
      },
      templates,
    });

    expect(result.reason).toBe("already_sent_today");
  });

  it("skips outside the notification window", () => {
    const result = buildNotificationDecision({
      context: {
        dayNumber: 4,
        streak: 3,
        taskTitle: "Time Log",
        userName: "Ari",
      },
      history: [],
      now: "2026-03-17T23:00:00.000Z",
      preferences: {
        channels: ["push", "email"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "Europe/London",
      },
      templates,
    });

    expect(result.reason).toBe("outside_window");
  });

  it("renders subject and body placeholders when ready", () => {
    const result = buildNotificationDecision({
      context: {
        dayNumber: 4,
        streak: 3,
        taskTitle: "Time Log",
        userName: "Ari",
      },
      history: [],
      now: "2026-03-17T09:00:00.000Z",
      preferences: {
        channels: ["push", "email"],
        quiet_end: "08:00",
        quiet_start: "21:00",
        timezone: "Europe/London",
      },
      templates,
    });

    expect(result.reason).toBe("ready");
    expect(result.selection?.subject).toContain("4");
    expect(result.selection?.body).toContain("Time Log");
  });
});
