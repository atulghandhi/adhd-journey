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
export type ProgressStatus = "locked" | "active" | "in_review" | "completed";
export type CheckInType = "completion" | "reinforcement_review";

export interface NotificationPreferences {
  channels: NotificationChannel[];
  quiet_end: string;
  quiet_start: string;
  reduced_motion?: boolean;
  timezone: string;
}

export interface PromptResponses {
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
    | "unlocked_next_task"
    | "waiting_until_tomorrow";
  spacedRepetition: SpacedRepetitionStateInsert;
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

export type JsonObject = Record<string, Json | undefined>;
