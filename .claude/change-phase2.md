# Phase 2 — Interactive Task Renderers

Priority: **High** (core UX transformation — "the app IS the task")

Depends on: **Phase 1** (interaction_type + interaction_config columns must exist)

---

## Overview

Currently every task renders identically in `JourneyScreen.tsx` (lines 155-183):
1. Title text
2. `MarkdownBlock` with `task_body`
3. "I did it" button → opens `CheckInSheet`

This phase replaces step 2 with a `TaskRenderer` that switches on `interaction_type` and renders a purpose-built interactive component. The "I did it" button becomes gated — it only enables once the interactive portion is complete.

---

## 2.1 Create the `TaskRenderer` switch component

### File to create
`apps/mobile/src/components/TaskRenderer.tsx`

### Interface

```tsx
import type { TaskRow } from "@focuslab/shared";

interface TaskRendererProps {
  /** Called when the interactive portion is complete (enables check-in) */
  onComplete: (data?: Record<string, unknown>) => void;
  /** The task to render */
  task: TaskRow;
}
```

### Implementation

```tsx
export function TaskRenderer({ onComplete, task }: TaskRendererProps) {
  const config = task.interaction_config as Record<string, unknown>;

  switch (task.interaction_type) {
    case "drag_list":
      return <DragListTask config={config} onComplete={onComplete} />;
    case "timed_challenge":
      return <TimedChallengeTask config={config} onComplete={onComplete} />;
    case "breathing_exercise":
      return <BreathingExerciseTask config={config} onComplete={onComplete} />;
    case "reflection_prompts":
      return <ReflectionPromptsTask config={config} onComplete={onComplete} />;
    case "journal":
      return <JournalTask config={config} onComplete={onComplete} />;
    case "community_prompt":
      return <CommunityPromptTask config={config} onComplete={onComplete} />;
    case "markdown":
    default:
      return <MarkdownTask onComplete={onComplete} taskBody={task.task_body} />;
  }
}
```

### MarkdownTask (default fallback)
This preserves the current behavior. Renders `MarkdownBlock` with `task.task_body` and calls `onComplete()` immediately on mount (since markdown tasks don't have an interactive gate — the "I did it" button is always enabled, matching current behavior).

```tsx
function MarkdownTask({ onComplete, taskBody }: { onComplete: () => void; taskBody: string }) {
  useEffect(() => { onComplete(); }, [onComplete]);
  return <MarkdownBlock content={taskBody} />;
}
```

### File organization
Create each interactive renderer in its own file under a new directory:
```
apps/mobile/src/components/tasks/
  DragListTask.tsx
  TimedChallengeTask.tsx
  BreathingExerciseTask.tsx
  ReflectionPromptsTask.tsx
  JournalTask.tsx
  CommunityPromptTask.tsx
```

Import them all into `TaskRenderer.tsx`.

---

## 2.2 Integrate TaskRenderer into JourneyScreen

### File to modify
`apps/mobile/src/screens/journey/JourneyScreen.tsx`

### Changes

**A. Add state for interactive completion:**
```tsx
const [taskInteractionComplete, setTaskInteractionComplete] = useState(false);
const [taskInteractionData, setTaskInteractionData] = useState<Record<string, unknown> | undefined>();
```

Reset both when `state?.currentTask?.task.id` changes:
```tsx
useEffect(() => {
  setTaskInteractionComplete(false);
  setTaskInteractionData(undefined);
}, [state?.currentTask?.task.id]);
```

**B. Replace the MarkdownBlock rendering (lines 164-166):**

Current:
```tsx
<View className="mt-4">
  <MarkdownBlock content={state.currentTask.task.task_body} />
</View>
```

Replace with:
```tsx
<View className="mt-4">
  <TaskRenderer
    onComplete={(data) => {
      setTaskInteractionComplete(true);
      setTaskInteractionData(data);
    }}
    task={state.currentTask.task}
  />
</View>
```

**C. Gate the "I did it" button (lines 167-171):**

Current:
```tsx
<View className="mt-4">
  <PrimaryButton onPress={() => setSheetVisible(true)}>
    I did it
  </PrimaryButton>
</View>
```

Change to:
```tsx
<View className="mt-4">
  <PrimaryButton
    disabled={!taskInteractionComplete}
    onPress={() => setSheetVisible(true)}
  >
    {taskInteractionComplete ? "I did it" : "Complete the task above first"}
  </PrimaryButton>
</View>
```

**D. Pass interaction data to check-in (optional but valuable):**
When `handleCheckIn` is called, include `taskInteractionData` in the `promptResponses` or as a separate field. This lets the backend store what the user actually did (e.g., their drag-list items, journal entry, reflection answers). For now, merge into `promptResponses.interaction_data`:

```tsx
const handleCheckIn = async (input: CompletionCheckInInput) => {
  // ... existing code ...
  await submitCompletionCheckIn({
    input: {
      ...input,
      promptResponses: {
        ...input.promptResponses,
        interaction_data: taskInteractionData ? JSON.stringify(taskInteractionData) : undefined,
      },
    },
    taskId: state.currentTask.task.id,
  });
  // ... existing code ...
};
```

---

## 2.3 DragListTask — drag-and-drop list builder

### File to create
`apps/mobile/src/components/tasks/DragListTask.tsx`

### Purpose
User builds a list of items (e.g., "3-5 interests to rotate between"). The interaction IS the learning — they're not reading about task cycling, they're doing it.

### Config shape
```ts
interface DragListConfig {
  instruction?: string;  // e.g., "Build your rotation list"
  maxItems?: number;     // default 5
  minItems?: number;     // default 3
  placeholder?: string;  // e.g., "Add an interest, project, or hobby..."
}
```

### UI structure
1. **Instruction text** at top (from `config.instruction` or fallback "Add your items below")
2. **Item list** — each item is a row with:
   - Drag handle icon (left) — use `GripVertical` from `lucide-react-native`
   - Item text (center)
   - Delete button (right) — use `X` from `lucide-react-native`, only visible on swipe or as a small icon
3. **Add input** at bottom — TextInput with the placeholder text and an "Add" button
4. **Counter** — "{current}/{minItems} minimum" below the list
5. Items are reorderable via drag (use `react-native-reanimated` for drag animation)

### Drag implementation
Use `react-native-gesture-handler` `PanGestureHandler` combined with `react-native-reanimated` `useAnimatedGestureHandler`. Each item tracks its `translateY` position. On drag end, reorder the items array.

If adding `react-native-gesture-handler` as a dependency causes issues (it should already be installed via expo), use a simpler approach: up/down arrow buttons instead of true drag-and-drop. The key is that the user is BUILDING the list, not reading about it.

### Completion gate
Call `onComplete({ items: [...] })` only when `items.length >= minItems`. Call it every time the list changes and meets the threshold (so the button enables/disables reactively).

### Haptics
- `selectionChanged` haptic when adding an item
- `selectionChanged` haptic when reordering
- `impactLight` haptic when deleting an item

### Animations
- New items animate in with `AnimatedCardEntrance` (scale + translateY)
- Deleted items fade out (opacity 1→0, 150ms)
- Drag: item lifts slightly (scale 1.02, shadow increases) during drag

---

## 2.4 TimedChallengeTask — countdown with optional breathing visual

### File to create
`apps/mobile/src/components/tasks/TimedChallengeTask.tsx`

### Purpose
Tasks where the user must sit with an experience for a set duration (e.g., "urge surf for 60 seconds"). The timer IS the task — they can't skip it.

### Config shape
```ts
interface TimedChallengeConfig {
  breathingCadence?: {
    exhaleSeconds: number;
    holdSeconds: number;
    inhaleSeconds: number;
  } | null;
  durationSeconds: number;  // default 60
  label?: string;           // e.g., "Sit with the urge"
}
```

### UI structure
1. **Label** at top (from `config.label` or "Stay with it")
2. **Circular timer** — large circle (200x200px) in the center of the card:
   - SVG arc that fills clockwise as time progresses (stroke in `green-500`, background stroke in `green-200`)
   - Time remaining in the center: `MM:SS` format, large bold text
   - If `breathingCadence` is set: the circle pulses (scale 1.0 → 1.1 → 1.0) on the breathing rhythm with text below saying "Breathe in..." / "Hold..." / "Breathe out..."
3. **Start button** — "Begin" button that starts the timer. Changes to a subtle "pause" icon during countdown.
4. **Progress** — "X seconds remaining" text below the circle

### Timer implementation
- Use `useEffect` with `setInterval(1000)` for the countdown
- Store `secondsRemaining` in state, `isRunning` boolean
- The timer CANNOT be fast-forwarded or skipped
- When `secondsRemaining` reaches 0: haptic `successNotification`, call `onComplete()`
- If the user backgrounds the app, use the elapsed wall-clock time on return to adjust (compare `Date.now()` with start time)

### Breathing cadence animation
If `breathingCadence` is provided:
- Calculate total cycle: `inhale + hold + exhale` seconds
- Use `react-native-reanimated` `withRepeat` + `withSequence`:
  - Inhale phase: scale 1.0 → 1.15 over `inhaleSeconds * 1000`ms
  - Hold phase: stay at 1.15 for `holdSeconds * 1000`ms
  - Exhale phase: scale 1.15 → 1.0 over `exhaleSeconds * 1000`ms
- Show phase text: "Breathe in", "Hold", "Breathe out"
- Haptic `impactLight` at each phase transition

### Completion gate
`onComplete()` is called ONLY when the timer reaches 0. Button stays disabled until then.

---

## 2.5 BreathingExerciseTask — dedicated breathing guide

### File to create
`apps/mobile/src/components/tasks/BreathingExerciseTask.tsx`

### Purpose
A standalone breathing exercise (not attached to a countdown challenge). Used for mindfulness tasks.

### Config shape
```ts
interface BreathingExerciseConfig {
  durationSeconds: number;   // total exercise duration
  exhaleSeconds: number;     // default 6
  holdSeconds: number;       // default 4
  inhaleSeconds: number;     // default 4
  label?: string;
}
```

### UI structure
Very similar to TimedChallengeTask with breathing cadence, but:
- The breathing visual is the PRIMARY element (centered, large, 240x240px)
- Use a pulsing filled circle (not just a stroke arc): `green-500` circle that grows/shrinks
- Text overlaid on the circle: "Breathe in" / "Hold" / "Breathe out"
- Completed cycles counter below: "3 of 8 cycles complete"
- Total cycles = `durationSeconds / (inhaleSeconds + holdSeconds + exhaleSeconds)`

### Reuse
Consider extracting a shared `BreathingCircle` component used by both `TimedChallengeTask` (when it has a breathing cadence) and `BreathingExerciseTask`. Put it in `apps/mobile/src/components/tasks/BreathingCircle.tsx`.

### Completion gate
`onComplete()` when all cycles are complete (i.e., total time elapsed ≥ `durationSeconds`).

---

## 2.6 ReflectionPromptsTask — sequential short questions

### File to create
`apps/mobile/src/components/tasks/ReflectionPromptsTask.tsx`

### Purpose
The task IS answering 2-4 short reflection questions. Different from the post-task check-in — this is the primary activity.

### Config shape
```ts
interface ReflectionPromptsConfig {
  prompts: string[];  // 2-4 questions
}
```

### UI structure
1. Show one prompt at a time, large text (20px bold)
2. Below the prompt: a `TextInput` (multiline, min-height 100px)
3. **Progress dots** at the top: small circles showing which prompt you're on (filled = done, outlined = current, dimmed = upcoming)
4. "Next" button below the input — advances to the next prompt. On the last prompt, button says "Finish"
5. Transition animation between prompts: current prompt slides out left, new prompt slides in from right (using `react-native-reanimated` translateX + opacity)

### State management
```tsx
const [currentIndex, setCurrentIndex] = useState(0);
const [answers, setAnswers] = useState<string[]>([]);
```

### Completion gate
- "Next" is disabled if the current answer is empty (or less than 10 characters — a reasonable minimum to prevent empty taps)
- `onComplete({ answers })` is called when the user taps "Finish" on the last prompt with a valid answer

### Haptics
- `selectionChanged` on "Next" tap
- `successNotification` on "Finish" tap

---

## 2.7 JournalTask — prompted writing

### File to create
`apps/mobile/src/components/tasks/JournalTask.tsx`

### Purpose
A focused writing task with a prompt.

### Config shape
```ts
interface JournalConfig {
  minCharacters?: number;  // default 50
  prompt: string;
}
```

### UI structure
1. **Prompt** at top — large text (18px semibold), italicized, in a subtle `green-100` background pill/card
2. **TextInput** — large multiline input, full-width, min-height 200px. Placeholder: "Start writing..."
3. **Character counter** below the input: "42/50 characters" — turns green when threshold met
4. The input should feel inviting — generous padding, large font (16px), comfortable line height (1.6)

### Completion gate
`onComplete({ entry: text })` when `text.length >= minCharacters`.

### Haptics
- `successNotification` when the character threshold is first crossed

---

## 2.8 CommunityPromptTask — nudge to post

### File to create
`apps/mobile/src/components/tasks/CommunityPromptTask.tsx`

### Purpose
The task is to share something in the community thread. This component shows the prompt and a button to navigate to the Community tab.

### Config shape
```ts
interface CommunityPromptConfig {
  navigateTo?: string;  // default "community"
  prompt: string;
}
```

### UI structure
1. **Prompt** displayed as a quote-style block (left green border, italic text)
2. **"Open community"** button — navigates to the Community tab using `expo-router`: `router.push("/(tabs)/community")`
3. Below the button: "Come back here and tap 'I did it' after you've posted."

### Completion gate
This one is tricky — we can't easily verify the user actually posted. Two options:

**Option A (simple, recommended for now):** Call `onComplete()` immediately on mount, like `markdown` type. The user must still go through the check-in flow ("I did it" → CheckInSheet) which asks "Did you try it?" — that's the honor system gate.

**Option B (future enhancement):** Query the community_posts table to check if the user has posted in this task's thread today. Only call `onComplete()` if they have. This requires passing the task ID and user ID into the component.

Implement Option A for now. Add a `// TODO: Option B` comment for future enhancement.

---

## 2.9 Add imports to TaskRenderer

### File: `apps/mobile/src/components/TaskRenderer.tsx`

```tsx
import { useEffect } from "react";
import type { TaskRow } from "@focuslab/shared";
import { MarkdownBlock } from "./MarkdownBlock";
import { DragListTask } from "./tasks/DragListTask";
import { TimedChallengeTask } from "./tasks/TimedChallengeTask";
import { BreathingExerciseTask } from "./tasks/BreathingExerciseTask";
import { ReflectionPromptsTask } from "./tasks/ReflectionPromptsTask";
import { JournalTask } from "./tasks/JournalTask";
import { CommunityPromptTask } from "./tasks/CommunityPromptTask";
```

---

## 2.10 Testing

### Unit tests to add
Create `apps/mobile/src/test/TaskRenderer.test.ts`:

Since RNTL component rendering is blocked by the native bridge issue, test the logic:
1. **Config parsing** — validate that each config type parses correctly from JSON
2. **Completion gate logic** — test that DragListTask's completion condition (items.length >= minItems) works
3. **Timer logic** — test that TimedChallengeTask calculates remaining time correctly
4. **Reflection completion** — test that all prompts must be answered

### Manual testing checklist
For each interaction type, test on Expo Go:
- [ ] Renders correctly in light mode
- [ ] Renders correctly in dark mode
- [ ] "I did it" button is disabled before interaction is complete
- [ ] "I did it" button enables after interaction is complete
- [ ] Check-in sheet opens and submits successfully
- [ ] Haptics fire at appropriate moments
- [ ] Reduced motion mode works (no spring animations, just opacity fades)
- [ ] Landscape orientation doesn't break layout

### Dependencies
Check if any new npm packages are needed:
- `react-native-gesture-handler` — should already be installed via expo (verify in `apps/mobile/package.json`)
- `react-native-svg` — needed for the circular timer; should already be available via expo (check `expo install react-native-svg` if not)
- No other new dependencies should be required

---

## Implementation order

Build and test one renderer at a time:
1. **MarkdownTask** (2.1) — the fallback, ensures zero regression
2. **TimedChallengeTask** (2.4) — most visually impressive, good demo piece
3. **ReflectionPromptsTask** (2.6) — simple but clearly different from markdown
4. **JournalTask** (2.7) — similar to reflection, quick to build
5. **DragListTask** (2.3) — most complex (drag interactions)
6. **BreathingExerciseTask** (2.5) — reuses breathing circle from timed challenge
7. **CommunityPromptTask** (2.8) — simplest, just a navigation nudge
