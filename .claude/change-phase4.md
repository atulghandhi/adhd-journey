# Phase 4 — "Done for Today" Screen Improvements

Priority: **Medium** (fills dead space, adds daily engagement hooks)

Depends on: None (can be done independently)

---

## Overview

After completing today's check-in, `JourneyScreen.tsx` shows a "Done for today" state (screenshot 3). Currently it displays two cards ("Your next task unlocks tomorrow" and "Keep the momentum — Open community") with a large empty space below. This screen is seen every day post-completion — it's prime real estate for reinforcing progress and engagement.

---

## Context: Where "done for today" renders

In `JourneyScreen.tsx`, the "done for today" state is NOT a separate screen — it's part of the same `JourneyScreen` component. Looking at the code (lines 99-281), when `state?.currentTask` is null and there's no paywall/post-completion state, the screen shows minimal content.

However, looking at screenshot 3, the "Done for today" heading and "Your next task unlocks tomorrow" card ARE visible. This means there's likely a conditional branch we didn't see in the code OR the state is handled differently. 

**Key insight**: The "done for today" state occurs when the user has completed their check-in for the current task but the next day hasn't arrived yet. In this case:
- `state.currentTask` is null (no active task right now)
- `state.nextUnlockDate` is set (tomorrow)
- `state.isPostCompletion` is false (haven't finished day 30)
- `state.showPaywall` is false

The JourneyScreen needs to detect this specific state to render the enhanced "done for today" view.

---

## 4.1 Add progress mini-visualization

### File to modify
`apps/mobile/src/screens/journey/JourneyScreen.tsx`

### Where to add
After the "Your next task unlocks tomorrow" card, add a new `AppCard`:

```tsx
{/* Progress visualization — shown in "done for today" state */}
{!state?.currentTask && !state?.showPaywall && !state?.isPostCompletion && state ? (
  <AnimatedCardEntrance delay={200}>
    <AppCard>
      <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
        Your progress
      </Text>
      <View className="mt-4 items-center">
        <ProgressRing
          completed={state.completedCount}
          total={state.tasks.length}
        />
      </View>
      <Text className="mt-4 text-center text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
        Day {state.completedCount} of {state.tasks.length} complete
      </Text>
    </AppCard>
  </AnimatedCardEntrance>
) : null}
```

### New component: `ProgressRing`

Create `apps/mobile/src/components/ProgressRing.tsx`:

```tsx
interface ProgressRingProps {
  completed: number;
  size?: number;    // default 120
  strokeWidth?: number;  // default 10
  total: number;
}
```

**Implementation using `react-native-svg`:**
- Background circle: `stroke={green-200}`, full 360°
- Progress arc: `stroke={green-500}`, fill percentage = `completed / total`
- Center text: `"{completed}/{total}"` in bold
- Animate the arc fill on mount using `withSpring(targetValue, SPRING_GENTLE)` on the SVG `strokeDashoffset`

**SVG arc math:**
```tsx
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const progressOffset = circumference * (1 - completed / total);
```

Use Reanimated's `useAnimatedProps` to animate `strokeDashoffset` from `circumference` (empty) to `progressOffset` (filled).

### Dark mode
- Background circle stroke: `dark-border` color
- Progress arc: `green-500` (same in both modes, per design.md)
- Center text: `dark-text-primary`

---

## 4.2 Add motivational quote or micro-stat

### File to modify
`apps/mobile/src/screens/journey/JourneyScreen.tsx`

### Where to add
Below the progress ring card, add another `AppCard` with a rotating motivational line.

### Implementation

Create a constant array in a new file `apps/mobile/src/constants/motivation.ts`:

```tsx
export const DAILY_MOTIVATIONS = [
  "The fact that you showed up today matters more than you think.",
  "Small steps compound. You're building something real.",
  "Your brain is rewiring right now. Trust the process.",
  "Most people don't make it this far. You did.",
  "Consistency isn't about perfection — it's about showing up again.",
  "You're not behind. You're exactly where you need to be.",
  "The hard part was starting. You already did that.",
  "Every check-in is proof that you're taking this seriously.",
  "Progress isn't always visible. But it's always happening.",
  "Tomorrow you'll be glad you didn't quit today.",
] as const;
```

**Selection logic:** Pick a quote based on the current date (deterministic, so it doesn't change on re-render):
```tsx
const todayIndex = Math.floor(Date.now() / 86_400_000) % DAILY_MOTIVATIONS.length;
const motivation = DAILY_MOTIVATIONS[todayIndex];
```

**Rendering:**
```tsx
<AnimatedCardEntrance delay={300}>
  <AppCard>
    <Text className="text-base italic leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
      "{motivation}"
    </Text>
  </AppCard>
</AnimatedCardEntrance>
```

---

## 4.3 Surface spaced-reinforcement review card on "done for today"

### Problem
Currently the review card only shows on the `JourneyScreen` when `state?.reviewTask` is set AND a current task exists. But the "done for today" state is the PERFECT moment for review — the user just finished today's work and has a brief window of engagement.

### File to modify
`apps/mobile/src/screens/journey/JourneyScreen.tsx`

### What to change
The review task section (lines 209-241) currently renders independently of the "done for today" state. Move or duplicate it so it ALSO renders when there's no current task but a review is due:

```tsx
{/* Review card — show both during active task AND done-for-today state */}
{state?.reviewTask ? (
  <AnimatedCardEntrance delay={state?.currentTask ? 0 : 250}>
    <AppCard>
      <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
        Quick review
      </Text>
      <Text className="mt-2 text-xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
        {state.reviewTask.task.title}
      </Text>
      <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
        How is this one holding up? Quick gut-check.
      </Text>
      <View className="mt-4">
        <EmojiRating onChange={setSelectedReviewRating} value={selectedReviewRating} />
      </View>
      <View className="mt-4">
        <PrimaryButton
          disabled={!selectedReviewRating}
          onPress={() => { void handleReviewSubmit(); }}
        >
          Save review
        </PrimaryButton>
      </View>
    </AppCard>
  </AnimatedCardEntrance>
) : null}
```

**Key change:** Replace the current `[1,2,3,4,5].map(rating => <PrimaryButton>)` approach (lines 221-228) with the existing `EmojiRating` component. The emoji rating is already built, animated, and has haptics — it's much better UX than 5 identical green number buttons.

Import `EmojiRating` if not already imported:
```tsx
import { EmojiRating } from "../../components/EmojiRating";
```

---

## 4.4 "Done for today" heading enhancement

### Current
The heading shows "Done for today" as the main title. The streak badge is in the top-right.

### Enhancement
Make the heading more celebratory for higher streaks:

```tsx
const doneForTodayTitle = useMemo(() => {
  const streak = state?.streakCount ?? 0;
  if (streak >= 7) return "On fire";
  if (streak >= 3) return "Building momentum";
  return "Done for today";
}, [state?.streakCount]);
```

This adds mild novelty to the heading based on progress.

---

## Verification

### Visual checks
- [ ] Progress ring renders correctly with animated fill
- [ ] Progress ring adapts to dark mode
- [ ] Motivational quote appears below progress ring
- [ ] Quote changes daily but is stable within a day
- [ ] Review card shows with emoji rating (not number buttons)
- [ ] Review card works in "done for today" state (not just during active task)
- [ ] All cards have staggered entrance animations
- [ ] No empty space below the last card

### Functional checks
- [ ] Progress ring shows correct count (N of 30)
- [ ] Review submission works from the "done for today" state
- [ ] Heading changes with streak count
- [ ] Reduced motion: cards fade in instead of springing
