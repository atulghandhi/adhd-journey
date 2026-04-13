-- Add three new interaction types for richer in-app tasks.
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'checklist';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'guided_steps';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'time_tracker';
