import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CHANNELS,
} from "./constants/journey";
import type { Json, NotificationPreferences } from "./types";

const MINUTES_IN_DAY = 24 * 60;

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
}

export function getTimeZoneParts(value: Date | string, timeZone: string) {
  const date = asDate(value);
  const parts = getFormatter(timeZone).formatToParts(date);
  const entries = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: Number(entries.day),
    hour: Number(entries.hour),
    minute: Number(entries.minute),
    month: Number(entries.month),
    second: Number(entries.second),
    year: Number(entries.year),
  };
}

export function getDateKeyInTimeZone(value: Date | string, timeZone: string) {
  const parts = getTimeZoneParts(value, timeZone);

  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function parseClockValue(value: string) {
  const [hours, minutes] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (
    !Number.isInteger(parsedHours) ||
    !Number.isInteger(parsedMinutes) ||
    parsedHours < 0 ||
    parsedHours > 23 ||
    parsedMinutes < 0 ||
    parsedMinutes > 59
  ) {
    throw new Error(`Invalid clock value "${value}". Expected HH:MM.`);
  }

  return parsedHours * 60 + parsedMinutes;
}

export function getMinutesInTimeZone(value: Date | string, timeZone: string) {
  const parts = getTimeZoneParts(value, timeZone);

  return parts.hour * 60 + parts.minute;
}

function toDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid date key "${dateKey}". Expected YYYY-MM-DD.`);
  }

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function differenceInCalendarDays(
  later: Date | string,
  earlier: Date | string,
  timeZone: string,
) {
  return (
    toDayNumber(getDateKeyInTimeZone(later, timeZone)) -
    toDayNumber(getDateKeyInTimeZone(earlier, timeZone))
  );
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid date key "${dateKey}". Expected YYYY-MM-DD.`);
  }

  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

export function normalizeNotificationPreferences(
  value: Json | NotificationPreferences | null | undefined,
): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      channels: [...DEFAULT_NOTIFICATION_PREFERENCES.channels],
    };
  }

  const source = value as Record<string, Json | undefined>;
  const channels = Array.isArray(source.channels)
    ? source.channels.filter((channel): channel is (typeof NOTIFICATION_CHANNELS)[number] =>
        typeof channel === "string" &&
        (NOTIFICATION_CHANNELS as readonly string[]).includes(channel),
      )
    : [...DEFAULT_NOTIFICATION_PREFERENCES.channels];

  return {
    channels: channels.length > 0 ? channels : [...DEFAULT_NOTIFICATION_PREFERENCES.channels],
    quiet_end:
      typeof source.quiet_end === "string"
        ? source.quiet_end
        : DEFAULT_NOTIFICATION_PREFERENCES.quiet_end,
    quiet_start:
      typeof source.quiet_start === "string"
        ? source.quiet_start
        : DEFAULT_NOTIFICATION_PREFERENCES.quiet_start,
    reduced_motion:
      typeof source.reduced_motion === "boolean"
        ? source.reduced_motion
        : undefined,
    timezone:
      typeof source.timezone === "string"
        ? source.timezone
        : DEFAULT_NOTIFICATION_PREFERENCES.timezone,
  };
}

export function isWithinNotificationWindow(
  value: Date | string,
  preferences: NotificationPreferences,
) {
  const minutes = getMinutesInTimeZone(value, preferences.timezone);
  const quietStart = parseClockValue(preferences.quiet_start);
  const quietEnd = parseClockValue(preferences.quiet_end);

  if (quietStart === quietEnd) {
    return true;
  }

  if (quietStart > quietEnd) {
    return !(minutes >= quietStart || minutes < quietEnd);
  }

  return !(minutes >= quietStart && minutes < quietEnd);
}

export function getNotificationWindowStart(preferences: NotificationPreferences) {
  const quietEnd = parseClockValue(preferences.quiet_end);
  const hours = Math.floor(quietEnd / 60);
  const minutes = quietEnd % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function getNotificationWindowDuration(preferences: NotificationPreferences) {
  const quietStart = parseClockValue(preferences.quiet_start);
  const quietEnd = parseClockValue(preferences.quiet_end);

  if (quietStart === quietEnd) {
    return MINUTES_IN_DAY;
  }

  if (quietStart > quietEnd) {
    return quietStart - quietEnd;
  }

  return MINUTES_IN_DAY - (quietEnd - quietStart);
}
