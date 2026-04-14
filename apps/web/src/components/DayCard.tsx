import type { CheckInRow, JourneyTaskState } from "@focuslab/shared";

const INTERACTION_BADGES: Record<string, string> = {
  breathing_exercise: "Breathing",
  checklist: "Checklist",
  drag_list: "Priority Sort",
  guided_steps: "Guided Steps",
  journal: "Journal",
  markdown: "Read & Reflect",
  reflection_prompts: "Reflection",
  time_tracker: "Time Tracker",
  timed_challenge: "Timed Challenge",
};

const RATING_EMOJI: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
};

function summarizeInteraction(
  checkIn: CheckInRow,
  interactionType: string,
): string {
  const data = checkIn.prompt_responses as Record<string, unknown> | null;
  const interactionRaw = data?.interaction_data;
  const interaction =
    typeof interactionRaw === "string"
      ? (() => {
          try {
            return JSON.parse(interactionRaw);
          } catch {
            return null;
          }
        })()
      : null;

  if (checkIn.type === "skip") {
    const reason = data?.skip_reason;
    return typeof reason === "string" ? `Skipped: ${reason.replace(/_/g, " ")}` : "Skipped";
  }

  if (interactionType === "checklist" && interaction?.items) {
    const items = interaction.items as { checked?: boolean }[];
    const checked = items.filter((i) => i.checked).length;
    return `Checked ${checked}/${items.length} items`;
  }

  if (interactionType === "time_tracker" && interaction?.totalMinutes) {
    return `Tracked ${Math.round(interaction.totalMinutes as number)} minutes`;
  }

  if (interactionType === "breathing_exercise" && interaction?.durationSeconds) {
    const mins = Math.round((interaction.durationSeconds as number) / 60);
    return `Breathed for ${mins} min`;
  }

  if (interactionType === "journal") {
    const text = data?.what_happened;
    if (typeof text === "string" && text.length > 0) {
      return text.length > 100 ? `${text.slice(0, 100)}...` : text;
    }
  }

  if (checkIn.tried_it) {
    return "Completed";
  }

  return "Checked in";
}

interface DayCardProps {
  checkIn: CheckInRow | null;
  taskState: JourneyTaskState;
}

export function DayCard({ checkIn, taskState }: DayCardProps) {
  const badge = INTERACTION_BADGES[taskState.task.interaction_type] ?? "Task";
  const isSkipped = taskState.status === "skipped";

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_24px_rgba(27,67,50,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Day {taskState.task.order}
            </span>
            <span className="rounded-full bg-focuslab-background px-2.5 py-0.5 text-xs font-medium text-focuslab-secondary">
              {badge}
            </span>
            {isSkipped ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                Skipped
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-focuslab-primaryDark">
            {taskState.task.title}
          </h3>
        </div>
        {checkIn && checkIn.quick_rating > 0 ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-focuslab-background text-lg font-bold text-focuslab-primaryDark">
            {RATING_EMOJI[checkIn.quick_rating] ?? checkIn.quick_rating}
          </div>
        ) : null}
      </div>
      {checkIn ? (
        <p className="mt-3 text-sm leading-6 text-focuslab-secondary">
          {summarizeInteraction(checkIn, taskState.task.interaction_type)}
        </p>
      ) : (
        <p className="mt-3 text-sm italic leading-6 text-focuslab-secondary/60">
          Complete this in the app
        </p>
      )}
    </div>
  );
}
