-- Add task interaction metadata used by the mobile renderer.
-- Existing tasks default to markdown so current behaviour is preserved.

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
  'Controls which interactive renderer the mobile app uses for this task. markdown preserves the current MarkdownBlock flow.';

COMMENT ON COLUMN public.tasks.interaction_config IS
  'Type-specific configuration JSON. Schema depends on interaction_type.';
