# Phase 5 — Variable Content Format + Task Tagging

Priority: **Medium** (content strategy work — partially non-code)

Depends on: **Phase 1** (interaction_type column must exist), **Phase 2** (renderers must be built)

---

## Overview

This phase is about assigning the right `interaction_type` to each of the 30 tasks so that no two consecutive days feel the same. The key principle: **format unpredictability keeps the ADHD brain curious about "what's today?" rather than mentally skipping it.**

This is primarily a content/CMS task, not a code task. The code work is limited to adding format hint icons on the journey map.

---

## 5.1 Assign interaction types to all 30 tasks

### Where
Use the admin CMS at `/admin/tasks` (after Phase 1 adds the dropdown). Alternatively, write a SQL seed/migration.

### Distribution target
- **~8 tasks**: `markdown` — traditional read + do (but keep these short and punchy)
- **~6 tasks**: `timed_challenge` or `breathing_exercise` — experiential, timer-based
- **~6 tasks**: `reflection_prompts` — 2-4 question micro-reflections
- **~5 tasks**: `journal` — prompted writing
- **~3 tasks**: `drag_list` — list-building interactions
- **~2 tasks**: `community_prompt` — task is to post/share

### Constraint: no two consecutive days with the same type

Example valid sequence:
```
Day 1:  drag_list           (Build your interest rotation list)
Day 2:  timed_challenge     (5-min focus sprint)
Day 3:  breathing_exercise  (Urge surf — 60s breathing)
Day 4:  reflection_prompts  (Energy mapping reflection)
Day 5:  markdown            (Screen time audit instructions)
Day 6:  journal             (Dopamine journal entry)
Day 7:  reflection_prompts  (Weekly recalibration)
Day 8:  timed_challenge     (Breathing practice 2.0)
...
```

Example INVALID sequence:
```
Day 5:  markdown
Day 6:  markdown  ← BAD: same type two days in a row
```

### Suggested assignments (based on existing task titles from screenshot)

These are suggestions based on the task titles visible in the screenshots. The actual assignment depends on the task content authored in the CMS.

| Day | Title (from screenshot) | Suggested type | Config notes |
|-----|------------------------|----------------|--------------|
| 1 | Time Log Your Day | `drag_list` | Build a list of time blocks; or `journal` to write out your day |
| 2 | Identify Your Top 3 Urge Triggers | `reflection_prompts` | 3 prompts: "What triggers you?", "When does it happen?", "What do you do instead?" |
| 3 | The 5-Minute Urge Surf | `timed_challenge` | `{ durationSeconds: 300, label: "Surf the urge", breathingCadence: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6 } }` |
| 4 | Map Your Energy Peaks | `journal` | Prompt: "Write about when you feel most/least energized during a typical day" |
| 5 | Screen Time & Sensory Audit | `markdown` | Instructions to check screen time settings (external action) |
| 6 | The Dopamine Lemon | `reflection_prompts` | "What gives you quick dopamine?", "What gives you lasting satisfaction?", "What's one swap you could make?" |
| 7 | Reflection & Recalibration | `reflection_prompts` | Weekly reflection questions |

### How to apply via SQL (alternative to CMS)

If you want to batch-update all tasks at once, create a migration:

```sql
-- supabase/migrations/00005_seed_interaction_types.sql

UPDATE public.tasks SET interaction_type = 'drag_list', interaction_config = '{"minItems": 3, "maxItems": 8, "placeholder": "Add a time block...", "instruction": "Log how you spent your day"}' WHERE "order" = 1;
UPDATE public.tasks SET interaction_type = 'reflection_prompts', interaction_config = '{"prompts": ["What is your biggest urge trigger?", "When does it usually hit?", "What do you typically do when triggered?"]}' WHERE "order" = 2;
UPDATE public.tasks SET interaction_type = 'timed_challenge', interaction_config = '{"durationSeconds": 300, "label": "Surf the urge", "breathingCadence": {"inhaleSeconds": 4, "holdSeconds": 4, "exhaleSeconds": 6}}' WHERE "order" = 3;
-- ... continue for all 30 tasks
```

**Important:** Only create this migration AFTER all tasks are seeded in the DB. If the tasks don't exist yet (order 1-30), this migration will update 0 rows silently.

### Validation query
After applying, run:
```sql
SELECT "order", title, interaction_type,
  LAG(interaction_type) OVER (ORDER BY "order") as prev_type
FROM tasks
WHERE journey_id = '00000000-0000-0000-0000-000000000001'
ORDER BY "order";
```

Check that no row has `interaction_type = prev_type` (no consecutive duplicates).

---

## 5.2 Show format hint icons on the journey map

### File to modify
`apps/mobile/src/components/JourneyMap.tsx` (or the new `JourneyMapNode.tsx` from Phase 3)

### Purpose
Each node on the journey map gets a small icon indicating the task type. This creates curiosity ("what's tomorrow's format?") without spoiling content. Only show icons for UNLOCKED tasks (completed + active). Locked tasks show no icon (preserving the mystery for future days).

### Icon mapping

```tsx
import { Clock, Edit3, GripVertical, MessageCircle, Pen, Wind } from "lucide-react-native";

const INTERACTION_TYPE_ICONS: Record<string, typeof Clock> = {
  breathing_exercise: Wind,
  community_prompt: MessageCircle,
  drag_list: GripVertical,
  journal: Pen,
  markdown: Edit3,
  reflection_prompts: MessageCircle,  // or use a custom "?" icon
  timed_challenge: Clock,
};
```

### Rendering
Below each node circle (for unlocked tasks only), show a tiny icon (10px) in muted color:

```tsx
{!item.isLocked && item.task.interaction_type !== 'markdown' && (
  <View className="mt-1 items-center">
    <TypeIcon color="#B7E4C7" size={10} />
  </View>
)}
```

Don't show the icon for `markdown` type — it's the default and doesn't need a visual hint.

### Why only unlocked tasks
- Locked task icons would spoil the surprise of "what format is tomorrow?"
- Completed task icons serve as a visual record of what you've experienced
- Active task icon confirms what type you're about to do

---

## 5.3 Update the admin CMS task list to show type distribution

### File to modify
`apps/web/src/app/admin/tasks/page.tsx`

### Add a summary bar at the top
After the existing header, add a small stats section showing the distribution:

```tsx
const typeCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  tasks.forEach(task => {
    const type = (task as any).interaction_type || 'markdown';
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}, [tasks]);

// Render as small pills:
<div className="mt-4 flex flex-wrap gap-2">
  {Object.entries(typeCounts).map(([type, count]) => (
    <span key={type} className="rounded-full bg-focuslab-background px-3 py-1 text-xs font-medium text-focuslab-secondary">
      {type.replace(/_/g, ' ')}: {count}
    </span>
  ))}
</div>
```

### Add consecutive-type warning
If two adjacent tasks have the same `interaction_type`, show a yellow warning:

```tsx
const consecutiveWarnings = useMemo(() => {
  const warnings: number[] = [];
  for (let i = 1; i < tasks.length; i++) {
    if ((tasks[i] as any).interaction_type === (tasks[i-1] as any).interaction_type) {
      warnings.push(tasks[i].order);
    }
  }
  return warnings;
}, [tasks]);

{consecutiveWarnings.length > 0 && (
  <p className="mt-2 text-sm text-amber-600">
    ⚠ Days {consecutiveWarnings.join(', ')} have the same interaction type as the previous day.
  </p>
)}
```

---

## Verification

### Checks
- [ ] All 30 tasks have an `interaction_type` assigned (no nulls)
- [ ] No two consecutive days share the same `interaction_type`
- [ ] Distribution roughly matches the targets (~8 markdown, ~6 timed, ~6 reflection, ~5 journal, ~3 drag, ~2 community)
- [ ] Journey map shows type hint icons on unlocked nodes only
- [ ] Admin CMS shows type distribution summary
- [ ] Admin CMS warns about consecutive same-type tasks
- [ ] `turbo typecheck` passes after all changes
