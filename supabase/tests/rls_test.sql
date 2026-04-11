-- RLS policy tests for FocusLab
-- Run with: supabase test db

BEGIN;
SELECT plan(22);

--------------------------------------------------------------------------------
-- Helpers: create test users via Supabase auth and seed data
--------------------------------------------------------------------------------

-- Create two test users in auth.users (mimics sign-up trigger)
INSERT INTO auth.users (id, email, instance_id, aud, role, encrypted_password, confirmed_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@test.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password', gen_salt('bf')), now(), now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@test.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password', gen_salt('bf')), now(), now(), now());

-- The on_auth_user_created trigger should create profiles automatically.
-- Promote Alice to admin.
UPDATE public.profiles SET role = 'admin' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Seed a task
INSERT INTO public.tasks (id, journey_id, "order", title, task_body, explanation_body, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 1, 'Day 1', 'Task body', 'Explanation', true);

-- Seed user_progress for both users
INSERT INTO public.user_progress (user_id, task_id, journey_id, status, unlocked_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'active', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'active', now());

-- Seed check_ins for both users
INSERT INTO public.check_ins (user_id, task_id, journey_id, type, quick_rating, tried_it, time_spent_seconds)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'completion', 4, true, 120),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'completion', 3, true, 90);

-- Seed community post by Alice (visible, on unlocked task)
INSERT INTO public.community_posts (id, user_id, task_id, body, is_hidden)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Alice post', false);

-- Seed a hidden community post by Alice
INSERT INTO public.community_posts (id, user_id, task_id, body, is_hidden)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Hidden post', true);

-- Seed community reaction by Bob on the visible post
INSERT INTO public.community_reactions (id, post_id, user_id, emoji)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '👍');

-- Seed community report by Bob on the visible post
INSERT INTO public.community_reports (id, post_id, reporter_user_id, reason)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'spam');

--------------------------------------------------------------------------------
-- 1. Trigger: on_auth_user_created provisions profiles
--------------------------------------------------------------------------------

SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'on_auth_user_created trigger created profile for Alice'
);

SELECT ok(
  EXISTS (SELECT 1 FROM public.profiles WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'on_auth_user_created trigger created profile for Bob'
);

--------------------------------------------------------------------------------
-- 2. Profile isolation: users can only see/update their own profiles
--------------------------------------------------------------------------------

-- Simulate Bob's session
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "role": "authenticated"}';

SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'Bob can see his own profile'
);

--------------------------------------------------------------------------------
-- 3. Data isolation: check_ins
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.check_ins WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'Bob can see his own check-ins'
);

SELECT is(
  (SELECT count(*)::int FROM public.check_ins WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Bob cannot see Alice check-ins'
);

--------------------------------------------------------------------------------
-- 4. Data isolation: user_progress
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.user_progress WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'Bob can see his own user_progress'
);

SELECT is(
  (SELECT count(*)::int FROM public.user_progress WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Bob cannot see Alice user_progress'
);

--------------------------------------------------------------------------------
-- 5. Tasks: regular users can only see active tasks, cannot insert
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.tasks WHERE is_active = true),
  1,
  'Bob can see active tasks'
);

-- RLS throws on INSERT for non-admin
SELECT throws_ok(
  $$INSERT INTO public.tasks (journey_id, "order", title, task_body, explanation_body) VALUES ('00000000-0000-0000-0000-000000000001', 99, 'Evil', 'x', 'x')$$,
  '42501',
  NULL,
  'Bob cannot insert tasks (not admin)'
);

--------------------------------------------------------------------------------
-- 6. Community posts: Bob can see non-hidden posts on unlocked tasks
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.community_posts WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1,
  'Bob can see visible community post on unlocked task'
);

SELECT is(
  (SELECT count(*)::int FROM public.community_posts WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0,
  'Bob cannot see hidden community post'
);

--------------------------------------------------------------------------------
-- 7. Community reactions: Bob can see reactions on visible posts
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.community_reactions WHERE post_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1,
  'Bob can see reactions on visible posts'
);

--------------------------------------------------------------------------------
-- 8. Community reports: regular users cannot read reports
--------------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM public.community_reports),
  0,
  'Bob cannot see any community reports (admin only)'
);

--------------------------------------------------------------------------------
-- 9. Admin access: switch to Alice (admin)
--------------------------------------------------------------------------------

SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "authenticated"}';

-- Admin can see all check_ins
SELECT is(
  (SELECT count(*)::int FROM public.check_ins),
  2,
  'Admin Alice can see all check-ins'
);

-- Admin can see all user_progress
SELECT is(
  (SELECT count(*)::int FROM public.user_progress),
  2,
  'Admin Alice can see all user_progress'
);

-- Admin can see hidden community posts
SELECT is(
  (SELECT count(*)::int FROM public.community_posts WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  1,
  'Admin Alice can see hidden community posts'
);

-- Admin can see community reports
SELECT is(
  (SELECT count(*)::int FROM public.community_reports),
  1,
  'Admin Alice can see community reports'
);

-- Admin can insert tasks
SELECT lives_ok(
  $$INSERT INTO public.tasks (journey_id, "order", title, task_body, explanation_body) VALUES ('00000000-0000-0000-0000-000000000001', 99, 'Admin Task', 'body', 'explanation')$$,
  'Admin Alice can insert tasks'
);

-- Admin can update tasks
SELECT lives_ok(
  $$UPDATE public.tasks SET title = 'Updated' WHERE "order" = 99$$,
  'Admin Alice can update tasks'
);

-- Admin can delete tasks
SELECT lives_ok(
  $$DELETE FROM public.tasks WHERE "order" = 99$$,
  'Admin Alice can delete tasks'
);

--------------------------------------------------------------------------------
-- 10. Unauthenticated: no access
--------------------------------------------------------------------------------

RESET ROLE;
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '{}';

SELECT is(
  (SELECT count(*)::int FROM public.profiles),
  0,
  'Anon users cannot see any profiles'
);

SELECT is(
  (SELECT count(*)::int FROM public.tasks),
  0,
  'Anon users cannot see any tasks'
);

SELECT finish();
ROLLBACK;
