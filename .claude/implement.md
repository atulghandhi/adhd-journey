You are building FocusLab — a complete mobile-first ADHD journey app. Build the entire project from an empty repo to a working product. Do not stop until every milestone is done.

## Your instructions

1. Read every file in `.claude/` first: `prompt.md` (what to build), `plans.md` (how to build it — 17 milestones), `architecture.md` (tech stack, data model, APIs, timezone rules, security), `design.md` (visual specs, colors, fonts, animations), `agents.md` (repo structure, commands, conventions), `documentation.md` (docs template to fill in as you go). Also read `content/30-tasks-draft.md` (the 30 task definitions — use as seed data source) and `content/quiz-questions.json` (placeholder quiz questions).
2. Execute milestones 1–17 from `plans.md` in order. Do not skip milestones. Do not stop between milestones to ask questions.
3. After each milestone: run `npx turbo lint && npx turbo typecheck && npx turbo test`, fix all failures, commit with `feat: milestone-XX <name>`.
4. When you hit an ambiguity, make the best decision, record it in `plans.md` under "Implementation Notes", and keep going.
5. When you finish all 17 milestones, verify every item in the "Completion criteria" section below. Fix anything that fails. Then stop.

## Non-negotiable rules

- **Never stop to ask questions.** You have full authority to make decisions. Record decisions in `plans.md`.
- **Never skip tests.** Every milestone adds or updates tests for its core behavior.
- **Never deviate from the tech stack** in `architecture.md` without recording why in `plans.md`.
- **Never hardcode API keys.** Always read from environment variables.
- **Small commits.** One commit per milestone (or per logical sub-unit if a milestone is large). Conventional commit format: `feat:`, `fix:`, `test:`, `chore:`.

## How to handle external services

- **Supabase**: Run `supabase start` for the local stack. All DB, auth, storage, and Edge Functions work locally with zero cloud credentials. Use `supabase functions serve --env-file .env.local` to pass env vars to Edge Functions locally.
- **FCM / Resend / RevenueCat**: Check for env var at runtime. If missing → log `[STUB] <SERVICE> not configured — skipping` → return mock success → never crash. Implement the full integration code regardless.
- **RevenueCat specifically**: `react-native-purchases` requires an Expo Development Build (not Expo Go). When the SDK key is missing, show a "Dev mode: tap to unlock" bypass button so the paywall flow is testable in Expo Go without the native module.
- **Milestones tagged `[NEEDS CREDENTIALS]`**: Build everything, write tests with mocks, but skip live integration tests. Note them for human verification.

## How to handle ambiguity

You will encounter minor gaps. Here are pre-approved decisions — use these and move on:

1. **Expo Router + screens**: Use `apps/mobile/app/` for route files (Expo Router). Import actual screen components from `src/screens/`. This is the standard Expo Router pattern.
2. **`check_ins.time_spent_seconds`**: Start timer when user opens task screen, stop on check-in submit. Store delta.
3. **Timezone rule**: All time-sensitive operations use the user's timezone from `profiles.notification_preferences.timezone`. Calendar day = 00:00 to 23:59 in user's timezone. Check-in at 23:59 = same day. 00:00 = next day. This is standard calendar logic.
4. **Streak**: Consecutive calendar days (user's timezone, midnight boundary) with at least one `check_ins` row (any type). A day with zero check-ins breaks the streak.
5. **Community RLS + thread permanence**: `EXISTS (SELECT 1 FROM user_progress WHERE user_id = auth.uid() AND task_id = community_posts.task_id AND status != 'locked')`. This checks across ALL journey_id values — once a thread is unlocked, it stays unlocked even after journey restart.
6. **Notification cron via pg_cron + pg_net**: pg_cron runs SQL that uses `pg_net` to HTTP POST to the Edge Function URL. pg_cron cannot call Edge Functions directly. See `architecture.md` for the exact SQL.
7. **Push open tracking**: Use `expo-notifications` response listener → update `notification_log.opened_at` via direct Supabase call. Skip email open tracking in V1.
8. **Quiz questions**: Use `content/quiz-questions.json` (placeholder questions, 30 items). Seed into `quiz_questions` table. Admin can edit via CMS later.
9. **Community reports**: `community_reports` table (id, post_id, reporter_user_id, reason, created_at). RLS: users can insert their own reports, admins can read all.
10. **`journey_id` column**: On `tasks`, `user_progress`, `check_ins`, and `spaced_repetition_state`. Default UUID `'00000000-0000-0000-0000-000000000001'` for the single "ADHD Focus" journey. When a user restarts, a new journey_id is generated — old data is preserved under the old ID. Community thread access checks across ALL journey_ids.
11. **Offline check-in timestamp**: Client records `checked_in_at` at the moment the user taps submit. This timestamp is sent to `complete-check-in` Edge Function and used for time-gate calculations. If absent, server uses `now()`.
12. **CORS on Edge Functions**: All Edge Functions return CORS headers (`Access-Control-Allow-Origin: *`, etc.) via a shared utility at `supabase/functions/_shared/cors.ts`. Handle OPTIONS preflight.
13. **Auth email confirmation**: Supabase Auth has email confirmation enabled. Build a "Check your email" screen after registration. Local dev uses Inbucket (localhost:54324) for captured emails.
14. **Markdown editor (web)**: Use `@uiw/react-md-editor`.
15. **Charts (admin)**: Use `recharts`.
16. **Skeleton loading**: Use `moti/skeleton` or custom reanimated shimmer.
17. **Admin bootstrapping**: Create `scripts/make-admin.ts` that sets `profiles.role = 'admin'` for a given email. Can also be done manually via Supabase Studio SQL.

## Verification categories

Each acceptance criterion in `plans.md` is tagged:

- **[AUTO]** — Verify by running lint/typecheck/tests. You must verify these.
- **[LOCAL]** — Verify by running the app locally. Start dev server, confirm no errors.
- **[MANUAL]** — Requires human visual review. Implement to spec and move on.
- **[CREDENTIALS]** — Requires real API keys. Implement with stubs and move on.

## Code quality rules

- **Clean code**: Write maintainable, readable code. Prefer clarity over cleverness. Small functions with single responsibilities.
- **Error handling everywhere**: Every network call in try/catch. Every Edge Function returns structured errors. Global error boundary in mobile app. Never show blank screens, raw errors, or stack traces to users.
- **User-friendly error messages**: Toast messages like "Couldn't save your check-in — we'll try again when you're back online" — not "Error: fetch failed" or "500 Internal Server Error".
- **Performance**: App launch to current task visible in < 2 seconds. Animations at 60fps. Use TanStack Query caching aggressively.
- **Security**: Never log PII (emails, passwords, payment info). Log user IDs (UUIDs) only. All data access gated by RLS. Service role key never in client code.
- **TypeScript strict mode**: No `any` types except where unavoidable (document why). All function parameters and return types explicitly typed.
- **No dead code**: Remove unused imports, variables, and functions before committing.

## Completion criteria (do not stop until ALL are true)

- [ ] All 17 milestones in `plans.md` are implemented and marked `[x]`.
- [ ] `npm install` succeeds from repo root.
- [ ] `supabase db reset` applies all migrations + seed without errors.
- [ ] `npx turbo lint && npx turbo typecheck && npx turbo test` all pass with zero failures.
- [ ] `supabase functions serve --env-file .env.local` starts without errors.
- [ ] Mobile app launches in Expo Go: onboarding → tasks → check-in → progress flow works (payment uses dev mode bypass in Expo Go).
- [ ] Web dashboard loads: admin CMS (tasks, templates, moderation, analytics, SR config, rewards) and user stats views render.
- [ ] Spaced-repetition algorithm has ≥15 deterministic test cases.
- [ ] Journey progression logic is tested: unlock gating, time gating (timezone-aware), multi-day extension, reinforcement insertion, journey restart with journey_id.
- [ ] Notification scheduling is tested: template rotation, channel cycling, quiet hours (timezone-aware).
- [ ] RLS policies are tested: users can't access other users' data, non-admins can't access admin routes, community threads stay unlocked after restart.
- [ ] Freemium gate blocks task 16+ for unpaid users (tested).
- [ ] Community threads are gated by task unlock (RLS enforced, tested). Thread access persists after journey restart (tested).
- [ ] External services stub gracefully when credentials are missing (tested).
- [ ] CORS headers present on all Edge Function responses (tested).
- [ ] Global error boundary catches errors and shows recovery UI (tested).
- [ ] No PII in any log output (verified).
- [ ] `documentation.md` is updated to match the final state of the repo.
- [ ] `.env.example` has all required variables with descriptions.
- [ ] `eas.json` exists with development/preview/production build profiles.
- [ ] TypeScript types are auto-generated and up to date.
- [ ] `plans.md` "Implementation Notes" section documents every decision made during build.

## Start

Read `plans.md` now. Begin Milestone 01. The repo is empty — you must initialize everything from scratch (no package.json exists yet). Do not stop until every completion criterion above is checked off.
