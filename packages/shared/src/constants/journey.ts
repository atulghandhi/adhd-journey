export const DEFAULT_JOURNEY_ID = "00000000-0000-0000-0000-000000000001";
export const TOTAL_TASK_COUNT = 30;
export const FREE_TASK_LIMIT = 15;
export const MAX_MOTIVATING_ANSWER_LENGTH = 200;

export const NOTIFICATION_CHANNELS = ["push", "email"] as const;
export const NOTIFICATION_TONES = [
  "encouraging",
  "playful",
  "direct",
  "reflective",
] as const;
export const COMMUNITY_REACTION_EMOJIS = ["👎", "👍", "🔥", "❤️", "😮"] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  channels: [...NOTIFICATION_CHANNELS],
  quiet_end: "08:00",
  quiet_start: "21:00",
  timezone: "UTC",
} as const;

export const DEFAULT_RESOURCE_LINKS = [
  {
    description: "A starter dashboard for planning your focus week.",
    title: "ADHD Focus Toolkit",
    url: "https://example.com/focus-toolkit",
  },
  {
    description: "A printable one-page recap of the 30-day journey.",
    title: "30-Day Cheatsheet",
    url: "https://example.com/30-day-cheatsheet",
  },
  {
    description: "A curated reading list for understanding ADHD and attention.",
    title: "Top 10 ADHD Books",
    url: "https://example.com/adhd-books",
  },
  {
    description: "A few practical channels for focus-friendly learning.",
    title: "Focus YouTube Channels",
    url: "https://example.com/focus-youtube",
  },
] as const;
