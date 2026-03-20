# Phase 1 — Data Model: Add `interaction_type` and `interaction_config` to Tasks

Priority: **High** (unblocks all Phase 2 interactive renderer work)

---

## Overview

Currently every task is rendered identically: markdown body displayed via `MarkdownBlock`, with an "I did it" button that opens `CheckInSheet`. This phase adds two new columns to the `tasks` table so the mobile app knows *how* to render each task — as a drag-list, a timed challenge, a breathing exercise, etc.

---

## 1.1 Create a new Supabase migration

### File to create
`supabase/migrations/00004_task_interaction_type.sql`

### SQL content

```sql
-- Add interaction_type enum and column to tasks
-- Default is 'markdown' which preserves current behavior for all existing tasks

CREATE TYPE public.interaction_type AS ENUM (
  'markdown',
  'drag_list',
  'timed_challenge',
  'breathing_exercise',
  'reflection_prompts',
  'journal',
  'community_prompt'
);

ALTER TABLE public.tasks
  ADD COLUMN interaction_type public.interaction_type NOT NULL DEFAULT 'markdown';

ALTER TABLE public.tasks
  ADD COLUMN interaction_config jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tasks.interaction_type IS
  'Controls which interactive renderer the mobile app uses for this task. markdown = current MarkdownBlock behavior.';

COMMENT ON COLUMN public.tasks.interaction_config IS
  'Type-specific configuration JSON. Schema depends on interaction_type. See docs below.';
```

### Why `NOT NULL DEFAULT 'markdown'`
All 30 existing tasks (if seeded) will automatically get `interaction_type = 'markdown'` and `interaction_config = '{}'`. The mobile app's `TaskRenderer` (Phase 2) will fall back to the current `MarkdownBlock` for `'markdown'` type, so **zero existing behavior changes**.

### interaction_config JSON schemas by type

These are NOT enforced at the DB level (just jsonb). They are documented here and validated in the mobile app's TaskRenderer.

**`markdown`** — no config needed, `{}` is fine.

**`drag_list`** — for tasks where the user builds a list (e.g., Day 1 "rotating interest list"):
```json
{
  "minItems": 3,
  "maxItems": 5,
  "placeholder": "Add an interest, project, or hobby...",
  "instruction": "Build your rotation list"
}
```

**`timed_challenge`** — for tasks with a countdown timer (e.g., Day 3 "urge surf"):
```json
{
  "durationSeconds": 60,
  "label": "Sit with the urge",
  "breathingCadence": null
}
```
`breathingCadence` is optional — if null, just show a countdown. If set, see `breathing_exercise`.

**`breathing_exercise`** — visual breathing guide with inhale/hold/exhale phases:
```json
{
  "durationSeconds": 120,
  "inhaleSeconds": 4,
  "holdSeconds": 4,
  "exhaleSeconds": 6,
  "label": "Follow the circle"
}
```

**`reflection_prompts`** — 2-4 short questions shown one at a time:
```json
{
  "prompts": [
    "What triggered you most today?",
    "What did you do instead of the usual response?",
    "How do you feel right now?"
  ]
}
```

**`journal`** — prompted writing task:
```json
{
  "prompt": "Write about a time you felt truly focused. What were you doing? What made it different?",
  "minCharacters": 50
}
```

**`community_prompt`** — the task is to post in the community thread:
```json
{
  "prompt": "Share one thing you learned this week with the community.",
  "navigateTo": "community"
}
```

---

## 1.2 Regenerate TypeScript types

### Command to run
```bash
npx supabase gen types typescript --local > packages/shared/src/types/database.ts
```

### What changes
The `tasks` table types in `packages/shared/src/types/database.ts` (currently at line 554) will gain:
- `Row`: `interaction_type: Database["public"]["Enums"]["interaction_type"]` and `interaction_config: Json`
- `Insert`: same, both optional (have defaults)
- `Update`: same, both optional

A new `Enums` section will appear:
```ts
Enums: {
  interaction_type: 'markdown' | 'drag_list' | 'timed_challenge' | 'breathing_exercise' | 'reflection_prompts' | 'journal' | 'community_prompt'
}
```

### After regeneration, verify
- `TaskRow` (defined in `packages/shared/src/types/domain.ts:26` as `TableRow<"tasks">`) automatically picks up the new fields — no manual change needed.
- `JourneyTaskState.task` (domain.ts:64) is typed as `TaskRow`, so it also gains the fields automatically.
- The mobile app's `JourneyScreen.tsx` accesses `state.currentTask.task` which will now include `interaction_type` and `interaction_config`.

---

## 1.3 Update Edge Functions `_shared/domain.ts`

### File to modify
`supabase/functions/_shared/domain.ts`

### What to do
In the current repo, `supabase/functions/_shared/domain.ts` already derives `TaskRow`
from `../../../packages/shared/src/types/database.ts`:

```ts
type TableRow<Name extends TableName> = Database["public"]["Tables"][Name]["Row"];
export type TaskRow = TableRow<"tasks">;
```

That means **no manual TaskRow field edits are needed here**. Once
`packages/shared/src/types/database.ts` is regenerated or updated to include
`interaction_type` and `interaction_config`, the edge-function domain types pick up the
new fields automatically.

What to verify instead:
- `supabase/functions/_shared/domain.ts` still typechecks after the generated database
  types change
- any edge-function logic that pattern-matches task fields still compiles without manual
  type duplication

### How to verify EF consistency
Run `turbo test` — the EF equivalence tests in `packages/shared/src/__tests__/ef-equivalence.test.ts` (29 tests) compare shared and EF logic. They should still pass since the new fields are additive and don't affect business logic.

---

## 1.4 Update the Admin CMS task editor

### File to modify
`apps/web/src/app/admin/tasks/[id]/page.tsx`

### Current form state (line 20-30)
```ts
const [form, setForm] = useState({
  default_duration_days: 1,
  deeper_reading: "",
  difficulty_rating: 3,
  explanation_body: "",
  is_active: true,
  order: 1,
  tags: "adhd, focus",
  task_body: "",
  title: "",
});
```

### Changes needed

**A. Add to form state:**
```ts
interaction_type: "markdown" as const,
interaction_config: "{}",  // stored as a JSON string for the textarea editor
```

**B. Add to the `loadTask` effect (line 54-64):**
```ts
interaction_type: loadedTask.interaction_type,
interaction_config: JSON.stringify(loadedTask.interaction_config, null, 2),
```

**C. Add to `handleSave` (line 80-93):**
```ts
interaction_type: form.interaction_type,
interaction_config: JSON.parse(form.interaction_config || "{}"),
```
Wrap the `JSON.parse` in a try-catch — if invalid JSON, show `setStatus("Invalid interaction config JSON.")` and return early.

**D. Add UI controls in the form grid (after the "Active in journey" checkbox, ~line 243):**

A `<select>` dropdown for `interaction_type`:
```tsx
<label className="space-y-2">
  <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
    Interaction type
  </span>
  <select
    className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
    onChange={(event) =>
      setForm((current) => ({
        ...current,
        interaction_type: event.target.value as TaskRow["interaction_type"],
      }))
    }
    value={form.interaction_type}
  >
    <option value="markdown">Markdown (default)</option>
    <option value="drag_list">Drag List</option>
    <option value="timed_challenge">Timed Challenge</option>
    <option value="breathing_exercise">Breathing Exercise</option>
    <option value="reflection_prompts">Reflection Prompts</option>
    <option value="journal">Journal</option>
    <option value="community_prompt">Community Prompt</option>
  </select>
</label>
```

A `<textarea>` for `interaction_config` (raw JSON):
```tsx
<label className="space-y-2 md:col-span-2">
  <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
    Interaction config (JSON)
  </span>
  <textarea
    className="w-full rounded-2xl border border-focuslab-border px-4 py-3 font-mono text-sm text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
    onChange={(event) =>
      setForm((current) => ({ ...current, interaction_config: event.target.value }))
    }
    rows={6}
    value={form.interaction_config}
  />
</label>
```

Place these AFTER the existing grid fields but BEFORE the MarkdownEditor sections.

**E. Update the task list page (optional but helpful):**
In `apps/web/src/app/admin/tasks/page.tsx`, add a small badge showing the interaction type next to each task title. This helps the admin see at a glance which tasks have been assigned interactive types vs still being markdown.

In the task card (line 190), after the title `<h3>`, add:
```tsx
{task.interaction_type !== 'markdown' && (
  <span className="ml-2 inline-block rounded-full bg-focuslab-border px-2 py-0.5 text-xs font-medium text-focuslab-secondary">
    {task.interaction_type.replace(/_/g, ' ')}
  </span>
)}
```

**F. Update `handleCreate` in task list page:**
In `apps/web/src/app/admin/tasks/page.tsx` line 47-55, add to the insert object:
```ts
interaction_type: 'markdown',
interaction_config: {},
```

---

## 1.5 Verify everything still works

### Commands
```bash
supabase db reset          # applies all migrations including the new one
turbo lint
turbo typecheck
turbo test
```

### Checks
- All existing tasks in the DB should have `interaction_type = 'markdown'` and `interaction_config = '{}'`
- The mobile app should render exactly as before (no visual changes — Phase 2 adds the renderers)
- The admin CMS task editor should show the new dropdown and JSON textarea
- Creating a new task should work with the default interaction_type
- EF equivalence tests should pass
