-- Milestone 02 - FocusLab initial schema

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  payment_status text NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free', 'paid')),
  payment_receipt jsonb,
  notification_preferences jsonb NOT NULL DEFAULT jsonb_build_object(
    'channels', jsonb_build_array('push', 'email'),
    'quiet_start', '21:00',
    'quiet_end', '08:00',
    'timezone', 'UTC'
  ),
  onboarding_complete boolean NOT NULL DEFAULT false,
  motivating_answer text CHECK (motivating_answer IS NULL OR char_length(motivating_answer) <= 200),
  theme_preference text NOT NULL DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
  current_journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_active_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  "order" integer NOT NULL,
  title text NOT NULL,
  task_body text NOT NULL,
  explanation_body text NOT NULL,
  deeper_reading text,
  difficulty_rating integer NOT NULL DEFAULT 3 CHECK (difficulty_rating BETWEEN 1 AND 5),
  default_duration_days integer NOT NULL DEFAULT 1 CHECK (default_duration_days >= 1),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (journey_id, "order")
);

CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'in_review', 'completed')),
  unlocked_at timestamptz,
  completed_at timestamptz,
  current_day integer NOT NULL DEFAULT 1 CHECK (current_day >= 1),
  extended_days integer NOT NULL DEFAULT 0 CHECK (extended_days >= 0),
  extended_by_algorithm boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, task_id, journey_id)
);

CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  type text NOT NULL CHECK (type IN ('completion', 'reinforcement_review')),
  quick_rating integer NOT NULL CHECK (quick_rating BETWEEN 1 AND 5),
  tried_it boolean NOT NULL,
  prompt_responses jsonb,
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  checked_in_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.spaced_repetition_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ease_factor real NOT NULL DEFAULT 2.5,
  interval_days real NOT NULL DEFAULT 1,
  review_count integer NOT NULL DEFAULT 0,
  next_review_date date,
  last_review_rating integer CHECK (last_review_rating IS NULL OR last_review_rating BETWEEN 1 AND 5),
  UNIQUE (user_id, task_id, journey_id)
);

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👎', '👍', '🔥', '❤️', '😮')),
  UNIQUE (post_id, user_id, emoji)
);

CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('push', 'email')),
  subject text NOT NULL,
  body text NOT NULL,
  tone_tag text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('push', 'email')),
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  opened_at timestamptz
);

CREATE TABLE public.spaced_repetition_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_interval_days real NOT NULL DEFAULT 1,
  ease_floor real NOT NULL DEFAULT 1.3,
  struggle_threshold integer NOT NULL DEFAULT 2,
  max_reviews_per_day integer NOT NULL DEFAULT 1,
  decay_multiplier real NOT NULL DEFAULT 0.5,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, token)
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_unlocked_task(target_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_progress
    WHERE user_id = auth.uid()
      AND task_id = target_task_id
      AND status <> 'locked'
  );
$$;

CREATE INDEX idx_tasks_journey_order ON public.tasks(journey_id, "order");
CREATE INDEX idx_user_progress_user_status ON public.user_progress(user_id, status);
CREATE INDEX idx_user_progress_community ON public.user_progress(user_id, task_id, status);
CREATE INDEX idx_check_ins_user_checked_in_at ON public.check_ins(user_id, checked_in_at DESC);
CREATE INDEX idx_spaced_repetition_state_user_review_date ON public.spaced_repetition_state(user_id, next_review_date);
CREATE INDEX idx_community_posts_task_created_at ON public.community_posts(task_id, created_at DESC);
CREATE INDEX idx_notification_log_user_sent_at ON public.notification_log(user_id, sent_at DESC);
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);

CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_spaced_repetition_config_updated_at
BEFORE UPDATE ON public.spaced_repetition_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "tasks_select_active"
ON public.tasks
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "tasks_admin_insert"
ON public.tasks
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "tasks_admin_update"
ON public.tasks
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "tasks_admin_delete"
ON public.tasks
FOR DELETE
USING (public.is_admin());

CREATE POLICY "user_progress_select_own_or_admin"
ON public.user_progress
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_progress_insert_own"
ON public.user_progress
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_progress_update_own"
ON public.user_progress
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "check_ins_select_own_or_admin"
ON public.check_ins
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "check_ins_insert_own"
ON public.check_ins
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "spaced_repetition_state_select_own_or_admin"
ON public.spaced_repetition_state
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "spaced_repetition_state_update_own_or_admin"
ON public.spaced_repetition_state
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "spaced_repetition_state_insert_own"
ON public.spaced_repetition_state
FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "community_posts_select_visible_unlocked"
ON public.community_posts
FOR SELECT
USING (
  (NOT is_hidden AND public.has_unlocked_task(task_id))
  OR public.is_admin()
);

CREATE POLICY "community_posts_insert_unlocked"
ON public.community_posts
FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.has_unlocked_task(task_id));

CREATE POLICY "community_posts_admin_update"
ON public.community_posts
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "community_posts_admin_delete"
ON public.community_posts
FOR DELETE
USING (public.is_admin());

CREATE POLICY "community_reactions_select_visible"
ON public.community_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.community_posts
    WHERE community_posts.id = community_reactions.post_id
      AND ((NOT community_posts.is_hidden AND public.has_unlocked_task(community_posts.task_id)) OR public.is_admin())
  )
);

CREATE POLICY "community_reactions_insert_visible"
ON public.community_reactions
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.community_posts
    WHERE community_posts.id = community_reactions.post_id
      AND public.has_unlocked_task(community_posts.task_id)
      AND community_posts.is_hidden = false
  )
);

CREATE POLICY "community_reactions_delete_own"
ON public.community_reactions
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "community_replies_select_visible"
ON public.community_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.community_posts
    WHERE community_posts.id = community_replies.post_id
      AND ((NOT community_posts.is_hidden AND public.has_unlocked_task(community_posts.task_id)) OR public.is_admin())
  )
);

CREATE POLICY "community_replies_insert_visible"
ON public.community_replies
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.community_posts
    WHERE community_posts.id = community_replies.post_id
      AND public.has_unlocked_task(community_posts.task_id)
      AND community_posts.is_hidden = false
  )
);

CREATE POLICY "community_replies_admin_update"
ON public.community_replies
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "community_reports_insert_own"
ON public.community_reports
FOR INSERT
WITH CHECK (
  reporter_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.community_posts
    WHERE community_posts.id = community_reports.post_id
      AND ((NOT community_posts.is_hidden AND public.has_unlocked_task(community_posts.task_id)) OR public.is_admin())
  )
);

CREATE POLICY "community_reports_admin_select"
ON public.community_reports
FOR SELECT
USING (public.is_admin());

CREATE POLICY "notification_templates_select_active"
ON public.notification_templates
FOR SELECT
USING ((auth.uid() IS NOT NULL AND is_active = true) OR public.is_admin());

CREATE POLICY "notification_templates_admin_insert"
ON public.notification_templates
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "notification_templates_admin_update"
ON public.notification_templates
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "notification_templates_admin_delete"
ON public.notification_templates
FOR DELETE
USING (public.is_admin());

CREATE POLICY "notification_log_select_own_or_admin"
ON public.notification_log
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "spaced_repetition_config_select_authenticated"
ON public.spaced_repetition_config
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "spaced_repetition_config_admin_update"
ON public.spaced_repetition_config
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "push_tokens_select_own_or_admin"
ON public.push_tokens
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "push_tokens_insert_own"
ON public.push_tokens
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete_own_or_admin"
ON public.push_tokens
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "quiz_questions_select_authenticated"
ON public.quiz_questions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "quiz_questions_admin_insert"
ON public.quiz_questions
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "quiz_questions_admin_update"
ON public.quiz_questions
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "quiz_questions_admin_delete"
ON public.quiz_questions
FOR DELETE
USING (public.is_admin());
