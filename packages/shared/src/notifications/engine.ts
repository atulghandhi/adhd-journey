import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CHANNELS,
} from "../constants/journey";
import {
  getDateKeyInTimeZone,
  isWithinNotificationWindow,
  normalizeNotificationPreferences,
} from "../timezone";
import type {
  NotificationDecision,
  NotificationHistoryItem,
  NotificationPreferences,
  NotificationTemplateContext,
  NotificationTemplateRow,
} from "../types";

function interpolate(value: string, context: NotificationTemplateContext) {
  return value
    .replaceAll("{{task_title}}", context.taskTitle)
    .replaceAll("{{streak}}", String(context.streak))
    .replaceAll("{{day_number}}", String(context.dayNumber))
    .replaceAll("{{user_name}}", context.userName ?? "there");
}

export function selectNotificationChannel(
  history: NotificationHistoryItem[],
  preferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    channels: [...DEFAULT_NOTIFICATION_PREFERENCES.channels],
  },
) {
  const channels =
    preferences.channels.length > 0
      ? preferences.channels
      : [...NOTIFICATION_CHANNELS];

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

  const previousIndex = channels.indexOf(latest.channel);

  return channels[(previousIndex + 1) % channels.length] ?? channels[0];
}

export function selectNotificationTemplate(args: {
  channel: "email" | "push";
  history: NotificationHistoryItem[];
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
  context: NotificationTemplateContext;
  history: NotificationHistoryItem[];
  now?: string;
  preferences?: NotificationPreferences | null;
  templates: NotificationTemplateRow[];
}) {
  const now = args.now ?? new Date().toISOString();
  const preferences = normalizeNotificationPreferences(args.preferences);
  const sentToday = args.history.some(
    (item) =>
      getDateKeyInTimeZone(item.sentAt, preferences.timezone) ===
      getDateKeyInTimeZone(now, preferences.timezone),
  );

  if (sentToday) {
    return {
      channel: null,
      reason: "already_sent_today",
      selection: null,
    } satisfies NotificationDecision;
  }

  if (!isWithinNotificationWindow(now, preferences)) {
    return {
      channel: null,
      reason: "outside_window",
      selection: null,
    } satisfies NotificationDecision;
  }

  const channel = selectNotificationChannel(args.history, preferences);

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
