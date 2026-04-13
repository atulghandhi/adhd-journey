import type { TaskRow } from "@focuslab/shared";

import { BreathingExerciseTask } from "./tasks/BreathingExerciseTask";
import { ChecklistTask } from "./tasks/ChecklistTask";
import { CommunityPromptTask } from "./tasks/CommunityPromptTask";
import { DragListTask } from "./tasks/DragListTask";
import { GuidedStepsTask } from "./tasks/GuidedStepsTask";
import { JournalTask } from "./tasks/JournalTask";
import { MarkdownTask } from "./tasks/MarkdownTask";
import { ReflectionPromptsTask } from "./tasks/ReflectionPromptsTask";
import { TimedChallengeTask } from "./tasks/TimedChallengeTask";
import { TimeTrackerTask } from "./tasks/TimeTrackerTask";
import type { TaskCompletionChange } from "./tasks/types";

interface TaskRendererProps {
  onCompletionChange: TaskCompletionChange;
  task: TaskRow;
}

export function TaskRenderer({
  onCompletionChange,
  task,
}: TaskRendererProps) {
  switch (task.interaction_type) {
    case "drag_list":
      return (
        <DragListTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "timed_challenge":
      return (
        <TimedChallengeTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "breathing_exercise":
      return (
        <BreathingExerciseTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "reflection_prompts":
      return (
        <ReflectionPromptsTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "journal":
      return (
        <JournalTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "checklist":
      return (
        <ChecklistTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "guided_steps":
      return (
        <GuidedStepsTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "time_tracker":
      return (
        <TimeTrackerTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "community_prompt":
      return (
        <CommunityPromptTask
          config={task.interaction_config}
          onCompletionChange={onCompletionChange}
        />
      );
    case "markdown":
    default:
      return (
        <MarkdownTask
          onCompletionChange={onCompletionChange}
          taskBody={task.task_body}
        />
      );
  }
}
