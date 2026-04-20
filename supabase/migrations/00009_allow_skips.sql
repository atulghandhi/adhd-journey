ALTER TABLE public.user_progress
DROP CONSTRAINT IF EXISTS user_progress_status_check;

ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_status_check
CHECK (status IN ('locked', 'active', 'in_review', 'completed', 'skipped'));

ALTER TABLE public.check_ins
DROP CONSTRAINT IF EXISTS check_ins_type_check;

ALTER TABLE public.check_ins
ADD CONSTRAINT check_ins_type_check
CHECK (type IN ('completion', 'reinforcement_review', 'skip'));

ALTER TABLE public.check_ins
DROP CONSTRAINT IF EXISTS check_ins_quick_rating_check;

ALTER TABLE public.check_ins
ADD CONSTRAINT check_ins_quick_rating_check
CHECK (
  (type = 'skip' AND quick_rating = 0)
  OR (type <> 'skip' AND quick_rating BETWEEN 1 AND 5)
);
