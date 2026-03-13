You are building FocusLab — a complete mobile-first ADHD journey app. Build the entire project from an empty repo to a working product. Do not stop until every milestone is done.

## Your instructions

1. Read every file in `.claude/` first: `prompt.md` (what to build), `plans.md` (how to build it — 18 milestones), `architecture.md` (tech stack, data model, APIs), `design.md` (visual specs, colors, fonts, animations), `agents.md` (repo structure, commands, conventions), `documentation.md` (docs template to fill in as you go). Also read `content/30-tasks-draft.md` (the 30 task definitions — use as seed data source).
2. Execute milestones 1–18 from `plans.md` in order. Do not skip milestones. Do not stop between milestones to ask questions.
3. After each milestone: run `npx turbo lint && npx turbo typecheck && npx turbo test`, fix all failures, commit with `feat: milestone-XX <name>`.
4. When you hit an ambiguity, make the best decision, record it in `plans.md` under "Implementation Notes", and keep going.
5. When you finish all 18 milestones, verify every item in the "Completion criteria" section below. Fix anything that fails. Then stop.

## Non-negotiable rules

- **Never stop to ask questions.** You have full authority to make decisions. Record decisions in `plans.md`.
- **Never skip tests.** Every milestone adds or updates tests for its core behavior.
- **Never deviate from the tech stack** in `architecture.md` without recording why in `plans.md`.
- **Never hardcode API keys.** Always read from environment variables.
- **Small commits.** One commit per milestone (or per logical sub-unit if a milestone is large). Conventional commit format: `feat:`, `fix:`, `test:`, `chore:`.

## How to handle external services

- **Supabase**: Run `supabase start` for the local stack. All DB, auth, storage, and Edge Functions work locally with zero cloud credentials.
- **FCM / Resend / RevenueCat**: Check for env var at runtime. If missing → log `[STUB] <SERVICE> not configured — skipping` → return mock success → never crash. Implement the full integration code regardless.
- **Milestones tagged `[NEEDS CREDENTIALS]`**: Build everything, write tests with mocks, but skip live integration tests. Note them for human verification.

## How to handle ambiguity

You will encounter minor gaps. Here are pre-approved decisions — use these and move on:

1. **Expo Router + screens**: Use `apps/mobile/app/` for route files (Expo Router). Import actual screen components from `src/screens/`. This is the standard Expo Router pattern.
2. **`check_ins.time_spent_seconds`**: Start timer when user opens task screen, stop on check-in submit. Store delta.
3. **Streak**: Consecutive calendar days with at least one `check_ins` row (any type). A day with zero check-ins breaks the streak.
4. **Community RLS**: `EXISTS (SELECT 1 FROM user_progress WHERE user_id = auth.uid() AND task_id = community_posts.task_id AND status != 'locked')`.
5. **Notification cron**: Run `daily-notifications` hourly via pg_cron. Filter users whose local time is within their notification window and who haven't been notified today.
6. **Push open tracking**: Use `expo-notifications` response listener → update `notification_log.opened_at` via direct Supabase call. Skip email open tracking in V1.
7. **Quiz questions**: Create `content/quiz-questions.json` with 30 questions (one per task). Seed into `quiz_questions` table. Admin can edit via CMS later.
8. **Community reports**: Add a `community_reports` table (id, post_id, reporter_user_id, reason, created_at) to the migration. RLS: users can insert their own reports, admins can read all.
9. **`journey_id` column**: Add to `tasks` and `user_progress` with a default UUID for the single "ADHD Focus" journey. Future-proofs for multi-journey without any current impact.
10. **Markdown editor (web)**: Use `@uiw/react-md-editor`.
11. **Charts (admin)**: Use `recharts`.
12. **Skeleton loading**: Use `moti/skeleton` or custom reanimated shimmer.

## Verification categories

Each acceptance criterion in `plans.md` is tagged:

- **[AUTO]** — Verify by running lint/typecheck/tests. You must verify these.
- **[LOCAL]** — Verify by running the app locally. Start dev server, confirm no errors.
- **[MANUAL]** — Requires human visual review. Implement to spec and move on.
- **[CREDENTIALS]** — Requires real API keys. Implement with stubs and move on.

## Completion criteria (do not stop until ALL are true)

- [ ] All 18 milestones in `plans.md` are implemented and marked `[x]`.
- [ ] `npm install` succeeds from repo root.
- [ ] `supabase db reset` applies all migrations + seed without errors.
- [ ] `npx turbo lint && npx turbo typecheck && npx turbo test` all pass with zero failures.
- [ ] `supabase functions serve` starts without errors.
- [ ] Mobile app launches in Expo Go: onboarding → tasks → check-in → progress flow works.
- [ ] Web dashboard loads: admin CMS (tasks, templates, moderation, analytics, SR config, rewards) and user stats views render.
- [ ] Spaced-repetition algorithm has ≥15 deterministic test cases.
- [ ] Journey progression logic is tested: unlock gating, time gating, multi-day extension, reinforcement insertion.
- [ ] Notification scheduling is tested: template rotation, channel cycling, quiet hours.
- [ ] RLS policies are tested: users can't access other users' data, non-admins can't access admin routes.
- [ ] Freemium gate blocks task 16+ for unpaid users (tested).
- [ ] Community threads are gated by task unlock (RLS enforced, tested).
- [ ] External services stub gracefully when credentials are missing (tested).
- [ ] Home screen widget code exists for iOS (WidgetKit) and Android (Glance/AppWidgets).
- [ ] `documentation.md` is updated to match the final state of the repo.
- [ ] `.env.example` has all required variables with descriptions.
- [ ] TypeScript types are auto-generated and up to date.
- [ ] `plans.md` "Implementation Notes" section documents every decision made during build.

## Start

Read `plans.md` now. Begin Milestone 01. Do not stop until every completion criterion above is checked off.
