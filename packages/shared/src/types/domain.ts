import type { Json, Database } from "./database";
import type {
  COMMUNITY_REACTION_EMOJIS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
} from "../constants/journey";

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<Name extends TableName> = Database["public"]["Tables"][Name]["Row"];
export type TableInsert<Name extends TableName> =
  Database["public"]["Tables"][Name]["Insert"];
export type TableUpdate<Name extends TableName> =
  Database["public"]["Tables"][Name]["Update"];

export type CheckInRow = TableRow<"check_ins">;
export type CheckInInsert = TableInsert<"check_ins">;
export type CommunityPostRow = TableRow<"community_posts">;
export type NotificationTemplateRow = TableRow<"notification_templates">;
export type NotificationLogRow = TableRow<"notification_log">;
export type ProfileRow = TableRow<"profiles">;
export type PushTokenRow = TableRow<"push_tokens">;
export type QuizQuestionRow = TableRow<"quiz_questions">;
export type SpacedRepetitionConfigRow = TableRow<"spaced_repetition_config">;
export type SpacedRepetitionStateRow = TableRow<"spaced_repetition_state">;
export type SpacedRepetitionStateInsert = TableInsert<"spaced_repetition_state">;
export type TaskRow = TableRow<"tasks">;
export type TaskInsert = TableInsert<"tasks">;
export type UserProgressRow = TableRow<"user_progress">;
export type UserProgressInsert = TableInsert<"user_progress">;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationTone = (typeof NOTIFICATION_TONES)[number];
export type CommunityReactionEmoji = (typeof COMMUNITY_REACTION_EMOJIS)[number];
export type ThemePreference = "light" | "dark" | "system";
export type PaymentStatus = "free" | "paid";
export type ToolkitStatus = "keep" | "maybe_later" | "not_for_me";
export type ProgressStatus = "locked" | "active" | "in_review" | "completed" | "skipped";
export type CheckInType = "completion" | "reinforcement_review" | "skip";
export type SkipReason = "too_hard" | "not_relevant" | "dont_understand" | "not_in_mood";

export interface NotificationPreferences {
  channels: NotificationChannel[];
  quiet_end: string;
  quiet_start: string;
  reduced_motion?: boolean;
  timezone: string;
}

export interface PromptResponses {
  interaction_data?: string;
  what_happened?: string;
  what_surprised?: string;
  what_was_hard?: string;
}

export interface JourneyTaskState {
  canOpen: boolean;
  currentDay: number;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  isPaywalled: boolean;
  lastCheckInAt: string | null;
  progress: UserProgressRow | null;
  status: ProgressStatus;
  subtitle: string | null;
  task: TaskRow;
  totalDays: number;
}

export interface JourneyReviewState {
  dueDate: string;
  state: SpacedRepetitionStateRow;
  task: TaskRow;
}

export interface JourneyState {
  activeTaskOrder: number | null;
  completedCount: number;
  currentTask: JourneyTaskState | null;
  isPostCompletion: boolean;
  motivatingAnswer: string | null;
  nextLockedTask: JourneyTaskState | null;
  nextUnlockDate: string | null;
  reviewTask: JourneyReviewState | null;
  showPaywall: boolean;
  streakCount: number;
  tasks: JourneyTaskState[];
}

export interface CompletionCheckInInput {
  checkedInAt?: string;
  promptResponses?: PromptResponses | null;
  quickRating: number;
  timeSpentSeconds: number;
  triedIt: boolean;
}

export interface SkipCheckInInput {
  reason: SkipReason;
  skippedAt?: string;
}

export interface CompletionTransition {
  activatedTaskId: string | null;
  checkIn: CheckInInsert;
  nextUnlockDate: string | null;
  progress: UserProgressRow[];
  reason:
    | "completed_journey"
    | "continued_task"
    | "extended_task"
    | "paywall_blocked"
    | "task_skipped"
    | "unlocked_next_task"
    | "waiting_until_tomorrow";
  spacedRepetition: SpacedRepetitionStateInsert | null;
}

export interface NotificationHistoryItem {
  channel: NotificationChannel;
  sentAt: string;
  templateId: string | null;
  toneTag: string | null;
}

export interface NotificationTemplateContext {
  dayNumber: number;
  streak: number;
  taskTitle: string;
  userName: string | null;
}

export interface NotificationSelectionResult {
  body: string;
  channel: NotificationChannel;
  subject: string;
  template: NotificationTemplateRow;
}

export interface NotificationDecision {
  channel: NotificationChannel | null;
  reason:
    | "already_sent_today"
    | "missing_channel"
    | "missing_template"
    | "outside_window"
    | "ready";
  selection: NotificationSelectionResult | null;
}

export interface QuizAttemptQuestion {
  correctIndex: number;
  id: string;
  options: string[];
  question: string;
  taskId: string;
}

export interface QuizScore {
  correct: number;
  percentage: number;
  recommendation: string;
  total: number;
}

export interface RestartJourneyPayload {
  currentJourneyId: string;
  newJourneyId: string;
  profileUpdate: Pick<TableUpdate<"profiles">, "current_journey_id">;
  progress: UserProgressInsert[];
}

export interface ResourceLink {
  description: string;
  title: string;
  url: string;
}

export interface ToolkitItem {
  created_at: string;
  id: string;
  journey_id: string;
  status: ToolkitStatus;
  task_id: string;
  updated_at: string;
  user_id: string;
}

// ---------------------------------------------------------------------------
// Gateway (App Disrupt) V1.5 types
// ---------------------------------------------------------------------------

export interface TimeWindow {
  end: string; // "HH:mm"
  start: string; // "HH:mm"
}

export interface OpenLimitConfig {
  appId: string;
  dailyLimit: number;
  enabled: boolean;
}

export interface EscalationConfig {
  baseDurationSeconds: number;
  capSeconds: number;
  incrementPerOpenSeconds: number;
}

export interface DoomScrollConfig {
  enabled: boolean;
  firstThresholdMinutes: number;
  secondThresholdMinutes: number;
}

export interface GatewayConfig {
  breathDurationSeconds: number;
  doomScroll: DoomScrollConfig;
  enabled: boolean;
  escalation: EscalationConfig;
  freeWindows: TimeWindow[];
  openLimits: OpenLimitConfig[];
}

export interface StrategySnapshot {
  strategyText: string;
  taskOrder: number;
  taskTitle: string;
}

export interface DailyOpenCount {
  count: number;
  date: string; // "YYYY-MM-DD"
}

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  breathDurationSeconds: 5,
  doomScroll: {
    enabled: true,
    firstThresholdMinutes: 10,
    secondThresholdMinutes: 30,
  },
  enabled: false,
  escalation: {
    baseDurationSeconds: 5,
    capSeconds: 20,
    incrementPerOpenSeconds: 3,
  },
  freeWindows: [],
  openLimits: [],
};

/**
 * Compute the breathing pause duration for a gateway activation.
 * Returns the base duration when under limit, escalating duration when over.
 */
export function computeGatewayDuration(
  config: GatewayConfig,
  appId: string,
  openCount: number,
): number {
  const limitConfig = config.openLimits.find(
    (l) => l.appId === appId && l.enabled,
  );
  const limit = limitConfig?.dailyLimit ?? Infinity;
  const { baseDurationSeconds, capSeconds, incrementPerOpenSeconds } =
    config.escalation;

  if (openCount <= limit) {
    return config.breathDurationSeconds;
  }

  const extra = (openCount - limit) * incrementPerOpenSeconds;
  return Math.min(baseDurationSeconds + extra, capSeconds);
}

/**
 * Check whether the current time falls within a free window.
 */
export function isInFreeWindow(
  freeWindows: TimeWindow[],
  currentHHMM: string,
): boolean {
  return freeWindows.some((w) => {
    if (w.start <= w.end) {
      // Normal range e.g. 17:00–20:00
      return currentHHMM >= w.start && currentHHMM <= w.end;
    }
    // Overnight range e.g. 22:00–08:00
    return currentHHMM >= w.start || currentHHMM <= w.end;
  });
}

/**
 * Format current time as "HH:mm" for free-window comparison.
 */
export function formatHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export type JsonObject = Record<string, Json | undefined>;
