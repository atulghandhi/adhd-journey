# Phase 3 — Journey Map Overhaul + Micro-Feedback

Priority: **High** (biggest visual transformation — makes the app feel alive)

Depends on: None (can be done in parallel with Phase 1/2)

---

## Overview

The current `JourneyMap` component (`apps/mobile/src/components/JourneyMap.tsx`, 69 lines) is a straight vertical list of nodes connected by lines. It reads as a checkbox checklist. This phase transforms it into a winding, animated path that feels like a journey map — with idle animations on completed nodes, a dramatic unlock reveal, and a streak system that creates mild loss-aversion.

---

## 3.1 Redesign JourneyMap layout: serpentine/winding path

### File to modify
`apps/mobile/src/components/JourneyMap.tsx` — full rewrite

### Current structure (lines 13-66)
A flat `View` with `gap-4` mapping over `state.tasks`, each rendered as a horizontal row: icon circle + vertical connector line on the left, day label + title on the right.

### New structure: S-curve path

The nodes should alternate left and right in groups, creating a winding path like a board game or trail map.

**Layout approach — "snake" pattern:**
- Nodes are arranged in rows of 3-4
- Row 1: nodes flow left → right
- Row 2: nodes flow right → left (reversed)
- Row 3: left → right again
- Connected by curved path segments between rows

**Simpler alternative (recommended for V1):**
Instead of true S-curves (which require SVG path math), use a **staggered offset** approach:
- Each node alternates between `marginLeft: '15%'` and `marginLeft: '55%'` (or similar)
- Connected by a diagonal line (a thin `View` with `transform: rotate(...)` or an SVG `<Line>`)
- This creates a zig-zag path that reads as a journey without complex SVG curve math

### Implementation plan

```tsx
// Each node gets a horizontal position based on index
function getNodeOffset(index: number): 'left' | 'right' {
  // Alternate every node
  return index % 2 === 0 ? 'left' : 'right';
}
```

**Node component** — extract into `JourneyMapNode.tsx`:
```tsx
interface JourneyMapNodeProps {
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
  order: number;
  position: 'left' | 'right';
  title: string;
}
```

Each node is:
- A circle (32px completed, 36px active, 28px locked)
- Day number label inside or below the circle
- Task title to the side (same side as the offset)
- Connected to the next node by a line segment

**Connector between nodes:**
Use `react-native-svg` for the connecting path. Draw an SVG `<Path>` that curves from one node to the next:

```tsx
// Simplified: straight diagonal line between alternating positions
<Svg height={60} width="100%">
  <Line
    stroke={isCompleted ? "#40916C" : "#B7E4C7"}
    strokeDasharray={isCompleted ? undefined : "4,4"}
    strokeWidth={2}
    x1={fromX}
    x2={toX}
    y1={0}
    y2={60}
  />
</Svg>
```

For a nicer curve, use a quadratic bezier:
```tsx
<Path
  d={`M ${fromX} 0 Q ${midX} 30 ${toX} 60`}
  fill="none"
  stroke={strokeColor}
  strokeDasharray={isCompleted ? undefined : "4,4"}
  strokeWidth={2}
/>
```

### Important: keep the component functional with the existing `JourneyState` type
The `JourneyMapProps` interface stays the same:
```tsx
interface JourneyMapProps {
  onSelectTask?: (taskId: string) => void;
  state: JourneyState;
}
```

`state.tasks` is an array of `JourneyTaskState` — all the data needed (isCompleted, isActive, isLocked, task.order, task.title) is already there.

### Auto-scroll to active node
After rendering, use `scrollTo` or a `ref` on the active node to scroll it into view. The `ProgressScreen` wraps `JourneyMap` in a `ScrollView`, so use `onLayout` to measure the active node's position and `scrollTo` it.

### Dependency check
- `react-native-svg` — verify it's in `apps/mobile/package.json`. If not: `npx expo install react-native-svg`.
- No other new dependencies needed.

---

## 3.2 "Up next" node highlight

### Where
Inside the new `JourneyMapNode` component.

### What
The active node (the one with `isActive: true`) gets a distinct visual treatment:
- **Pulsing border**: A `green-500` border that pulses opacity (0.5 → 1.0 → 0.5) using `withRepeat(withSequence(withTiming(1, {duration: 1000}), withTiming(0.5, {duration: 1000})))`. Use the `SPRING_GENTLE` config.
- **Slightly larger**: 36px circle vs 32px for completed and 28px for locked.
- **"START" badge**: A small pill below the node: `<View className="bg-focuslab-primary rounded-full px-2 py-0.5"><Text className="text-white text-[10px] font-bold">START</Text></View>`. Only shown if the task hasn't been opened yet today.

### Reduced motion
When reduced motion is on: no pulse animation, just a static `green-500` border (2px solid). Keep the size difference and START badge.

---

## 3.3 Replace lock icons with softer "upcoming" treatment

### Current (JourneyMap.tsx lines 32-34)
```tsx
} : item.isLocked ? (
  <Lock color="#6B7280" size={12} />
) : (
```

### New approach
Replace the `Lock` icon with a **dimmed empty circle**:
```tsx
} : item.isLocked ? (
  <View className="h-3 w-3 rounded-full border border-dashed border-focuslab-border dark:border-dark-border" />
) : (
```

This creates a dashed outline circle that feels like "not yet" rather than "forbidden." The key design principle: **locked nodes should invite anticipation, not communicate restriction.**

Also change the locked title text color from `text-gray-400` (line 55) to `text-focuslab-border dark:text-dark-border` — slightly more muted but still legible and on-brand.

Remove the `Lock` import from `lucide-react-native` (line 1) if it's no longer used anywhere.

---

## 3.4 Completed node idle animation ("jiggle")

### Where
Inside `JourneyMapNode` for nodes where `isCompleted: true`.

### Animation
A subtle idle wiggle using Reanimated:
```tsx
const rotation = useSharedValue(0);

useEffect(() => {
  if (isCompleted && !reducedMotion) {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 300 }),
        withTiming(2, { duration: 300 }),
        withTiming(0, { duration: 300 }),
      ),
      -1, // infinite repeat
      false,
    );
  }
}, [isCompleted, reducedMotion, rotation]);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ rotate: `${rotation.value}deg` }],
}));
```

This creates a gentle 2-degree oscillation that makes completed nodes feel "alive" without being distracting. The animation is very subtle — 2 degrees is barely perceptible but adds life.

### Reduced motion
No rotation animation. Static completed node.

### Tap behavior
Tapping a completed node calls `onSelectTask(taskId)`. In `ProgressScreen`, this should navigate to a read-only view of that day's task. For now, it can just show the task body — reuse `JourneyScreen` in read-only mode, or simply show a toast: "Day X: {title}" as a quick win. The navigation enhancement can be a follow-up.

---

## 3.5 Day-unlock reveal animation

### When it triggers
When the user completes a check-in and a new task unlocks, the `JourneyState` changes — a previously locked node becomes active. Detect this by comparing the previous `state.tasks` with the new one.

### Where to implement
In `ProgressScreen.tsx` — since the `JourneyMap` renders there. Alternatively, in `JourneyMapNode` itself.

### Approach: per-node entrance animation

Each `JourneyMapNode` accepts a `justUnlocked: boolean` prop. When true:
1. Node circle scales from 0 → 1 using `SPRING_SNAPPY` (with a 200ms delay so the user sees it happen)
2. Connector line "draws in" — animate the line's opacity or use an SVG `strokeDashoffset` animation
3. Haptic: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` — matching the "Task unlock" haptic from `design.md` line 116
4. The locked dashed circle morphs to the active pulsing circle

### How to detect "just unlocked"
Store the previous task states in a ref:
```tsx
const prevTaskStatesRef = useRef<JourneyTaskState[]>([]);

useEffect(() => {
  if (state?.tasks) {
    const justUnlockedIds = state.tasks
      .filter((t) => t.isActive && prevTaskStatesRef.current.find(
        (prev) => prev.task.id === t.task.id && prev.isLocked
      ))
      .map((t) => t.task.id);
    setJustUnlockedTaskIds(justUnlockedIds);
    prevTaskStatesRef.current = state.tasks;
  }
}, [state?.tasks]);
```

Pass `justUnlocked={justUnlockedTaskIds.includes(item.task.id)}` to each node.

Clear `justUnlockedTaskIds` after the animation completes (e.g., after 1 second timeout).

---

## 3.6 Streak badge overhaul

### File to modify
`apps/mobile/src/components/StreakBadge.tsx` (currently 20 lines)

### Current behavior (lines 8-19)
- Shows a green pill with flame icon + count
- **Hidden entirely when count ≤ 0** (line 9: `if (count <= 0) return null`)

### New behavior

**A. Always visible (never hidden):**
Remove the `if (count <= 0) return null` guard. When count is 0:
- Show a dimmed/grey flame: `<Flame color="#9CA3AF" size={14} />`
- Background: `bg-gray-200 dark:bg-gray-700` instead of `bg-[#22C55E]`
- Count text: `text-gray-400 dark:text-gray-500`
- This creates the "loss aversion" effect — the user sees the flame has gone out

When count > 0:
- Current green treatment (keep it)
- But larger: `px-4 py-2.5` and `text-base` instead of `text-sm`

**B. Animated counter increment:**
When `count` changes from N to N+1:
1. The number scales up 1.0 → 1.3 → 1.0 using `SPRING_SNAPPY`
2. The flame icon does a quick wobble (rotate -10° → 10° → 0° over 400ms)
3. A brief flash of brighter green (opacity pulse on background)

Track the previous count in a ref:
```tsx
const prevCountRef = useRef(count);
useEffect(() => {
  if (count > prevCountRef.current && count > 0) {
    // trigger animation
  }
  prevCountRef.current = count;
}, [count]);
```

**C. Make it larger on JourneyScreen:**
In `JourneyScreen.tsx` line 123, the `StreakBadge` is in the header. It's currently small. Consider adding a `size` prop:
- `size="sm"` (default) — current size, used in tight spaces
- `size="lg"` — larger, used in the journey header

For `lg`: `px-4 py-3`, `text-lg` count, `size={18}` flame icon.

### Design note from design.md (line 153)
> "When streak is 0 or user returns after absence: badge is hidden (not shown as '0' — no shame)."

**This is a deliberate override of the original design.** The user explicitly requested mild loss-aversion: "a flame counter that visibly dims if you miss a day creates a mild loss-aversion pull." The dimmed flame at 0 is NOT punishing — it's gentle. Update `design.md` line 153 to reflect this decision change:

```
When streak is 0: show dimmed grey flame with "0" count (mild loss-aversion — the flame is "out" but can be relit). Not punishing, just visible.
```

---

## 3.7 Haptics audit — add haptics to all meaningful interactions

### Files to modify
Multiple screens. For each, import `useHaptics` from `../../hooks/useHaptics` and add the appropriate call.

### Current haptic coverage (already implemented)
- ✅ `EmojiRating` selection — `selectionChanged` (EmojiRating.tsx:85)
- ✅ Check-in submit success — `successNotification` (JourneyScreen.tsx:69)
- ✅ Check-in submit error — `errorNotification` (JourneyScreen.tsx:72)

### New haptics to add

| Location | File | Interaction | Haptic type |
|----------|------|-------------|-------------|
| Community post submit | `CommunityScreen.tsx` ~line 56 (after `showToast("Post shared.")`) | Post created | `successNotification` |
| Community reaction toggle | `CommunityScreen.tsx` ~line 152-158 | Reaction tap | `selectionChanged` |
| Community reply submit | `CommunityScreen.tsx` ~line 195-206 | Reply created | `impactLight` |
| Journey map node tap | New `JourneyMapNode` component | Tap completed node | `impactLight` |
| Day unlock | `JourneyMapNode` (in unlock animation) | New day becomes available | `impactMedium` |
| Streak increment | `StreakBadge.tsx` (in count change animation) | Streak goes up | `successNotification` |
| Theme toggle | `AccountScreen.tsx` | Theme preference changes | `selectionChanged` |
| Notification toggle | `AccountScreen.tsx` | Push/email toggles | `selectionChanged` |
| Pull-to-refresh complete | `JourneyScreen.tsx` | Refresh finishes | `impactLight` |

### Implementation pattern
Each screen that needs haptics should use the existing `useHaptics` hook:
```tsx
const { impactLight, impactMedium, selectionChanged, successNotification } = useHaptics();
```

Then call the appropriate function at the right moment (after successful async action, not before).

---

## Verification

### Visual checks (Expo Go on device)
- [ ] Journey map nodes alternate left/right in a winding pattern
- [ ] Completed nodes have green filled circles with subtle jiggle
- [ ] Active node is larger with pulsing border and "START" badge
- [ ] Locked nodes show dashed empty circles (no lock icon)
- [ ] Path lines curve between nodes (solid for completed, dashed for locked)
- [ ] Active node auto-scrolls into view
- [ ] Day unlock triggers scale-in animation + haptic
- [ ] Streak badge shows dimmed flame at count 0
- [ ] Streak badge animates on increment
- [ ] All new haptics fire correctly

### Dark mode checks
- [ ] All new elements have `dark:` variants
- [ ] SVG stroke colors adapt to dark mode
- [ ] Dimmed streak badge is visible in dark mode

### Reduced motion checks
- [ ] No jiggle animation on completed nodes
- [ ] No pulse on active node (static border instead)
- [ ] Day unlock: simple opacity fade instead of spring
- [ ] Streak increment: no scale animation, just update text
- [ ] Haptics still fire (they're separate from visual motion)

### Automated tests
Add to `apps/mobile/src/test/`:
- `JourneyMapNode.test.ts` — test node position calculation (left/right alternation)
- `StreakBadge.test.ts` — test visibility logic (always visible), color logic (dimmed at 0, green at >0)
