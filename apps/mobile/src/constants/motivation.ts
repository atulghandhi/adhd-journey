export const DAILY_MOTIVATIONS = [
  "The fact that you showed up today matters more than you think.",
  "Small steps compound. You're building something real.",
  "Your brain is rewiring right now. Trust the process.",
  "Most people don't make it this far. You did.",
  "Consistency isn't about perfection - it's about showing up again.",
  "You're not behind. You're exactly where you need to be.",
  "The hard part was starting. You already did that.",
  "Every check-in is proof that you're taking this seriously.",
  "Progress isn't always visible. But it's always happening.",
  "Tomorrow you'll be glad you didn't quit today.",
] as const;

export function getLocalDateKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDailyMotivation(date: Date = new Date()) {
  const todayKey = getLocalDateKey(date);
  const todayIndex =
    Array.from(todayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    DAILY_MOTIVATIONS.length;

  return DAILY_MOTIVATIONS[todayIndex];
}
