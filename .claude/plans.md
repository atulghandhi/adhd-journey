# FocusLab Implementation Plan

This document is the complete execution plan, risk register, retention strategy, and architecture overview. We will implement milestone by milestone, validating each step with lint, typecheck, and tests.

Guiding principles:
- Retention over flash: every feature must justify itself by how it keeps ADHD users coming back.
- Task-first UX: the actionable task is always the first thing visible. Explanation is secondary.
- Algorithm-driven: spaced repetition adapts to each user, not a fixed schedule.
- Content-managed: tasks are authored via CMS, not hardcoded.
- Managed services: Supabase for backend, FCM for push, Resend for email, RevenueCat for payments. No self-hosted infra.

## Verification checklist (kept current)

Core commands (run after every milestone):
- [x] `npx turbo lint`
- [x] `npx turbo typecheck`
- [x] `npx turbo test`
- [x] `supabase db reset` (verify migrations + seed apply cleanly)
- Last verified: Milestones 04-16 feature pass + reward resources migration — 2026-03-17

## Milestones (executed in order)

Each milestone includes scope, key files/modules, acceptance criteria (tagged with verification category), and verification steps. Categories: **[AUTO]**, **[LOCAL]**, **[MANUAL]**, **[CREDENTIALS]** — see `implement.md` for definitions.

### Milestone 01 — Repo scaffold + tooling foundation [x]
Scope:
- **The repo is empty.** No `package.json`, no `node_modules`, no app code exists yet. This milestone creates everything from scratch.
- Initialize npm workspace root (`npm init -w`), then create three workspaces: `apps/mobile` (Expo), `apps/web` (Next.js), `packages/shared`.
- Create Expo app: `npx create-expo-app@latest apps/mobile` with Expo SDK 52+.
- Create Next.js app: `npx create-next-app@latest apps/web` with App Router, TypeScript, Tailwind CSS.
- Create `packages/shared/` with `package.json`, `tsconfig.json`, and `src/index.ts`.
- Supabase project already has `supabase/config.toml` — verify it works with `supabase start`.
- Set up TypeScript (strict), ESLint, Prettier across all workspaces.
- Set up testing: Vitest for `packages/shared` and `apps/web`, Jest + RNTL for `apps/mobile`.
- Install and configure `expo-dev-client` for Expo Development Builds (required for native modules: RevenueCat, push notifications).
- Create `eas.json` for EAS Build configuration (development, preview, production profiles).
- Create `app.config.ts` (or update `app.json`) with Expo config plugins for `expo-notifications`, `react-native-purchases`.
- Create `.env.example` with all required environment variables (from `architecture.md`).
- Create root `turbo.json` with `dev`, `build`, `lint`, `typecheck`, `test` pipelines.
- Verify shared package imports correctly from both apps.

Key files/modules:
- `package.json` (root workspace config)
- `turbo.json`
- `apps/mobile/` — Expo project
- `apps/mobile/eas.json` — EAS Build profiles
- `apps/mobile/app.config.ts` — Expo config with plugins
- `apps/web/` — Next.js project
- `packages/shared/package.json` + `src/index.ts`
- `.env.example`
- `tsconfig.json` (root + per-workspace)
- `.eslintrc.js` + `.prettierrc`

Acceptance criteria:
- `npm install` succeeds from root. **[AUTO]**
- `npx turbo dev` starts Expo + Next.js dev servers without errors. **[LOCAL]**
- `npx turbo lint && npx turbo typecheck && npx turbo test` all pass (even if tests are trivial). **[AUTO]**
- `supabase start` launches local stack successfully. **[LOCAL]**
- Shared package exports a placeholder and is importable from both apps. **[AUTO]**
- `.env.example` exists with all variables from `architecture.md`. **[AUTO]**
- `eas.json` exists with development/preview/production profiles. **[AUTO]**

### Milestone 02 — Database schema + migrations + seed data [x]
Scope:
- Write SQL migration(s) creating all tables from `architecture.md`: profiles, tasks, user_progress, check_ins, spaced_repetition_state, community_posts, community_reactions, community_replies, community_reports, notification_log, notification_templates, spaced_repetition_config, push_tokens, quiz_questions.
- **`journey_id` column**: Add `journey_id` (uuid) to `tasks`, `user_progress`, `check_ins`, and `spaced_repetition_state`. Default to a single hardcoded UUID constant for the "ADHD Focus" journey. This future-proofs for multi-journey support and enables journey restart without losing history. When a user restarts, a new `journey_id` is created — old progress, check-ins, and community posts are preserved under the old `journey_id`.
- Write database trigger: auto-create `profiles` row when a new `auth.users` row is inserted (use `NEW.raw_user_meta_data->>'name'` for the name field).
- Write RLS policies for all tables (as specified in `architecture.md`).
- **Community thread permanence**: The RLS policy for community_posts must check if the user has EVER unlocked the task in ANY journey (not just the current one). SQL: `EXISTS (SELECT 1 FROM user_progress WHERE user_id = auth.uid() AND task_id = community_posts.task_id AND status != 'locked')`. This ensures threads remain accessible after journey restart.
- Write `supabase/seed.sql` with:
    * 30 tasks sourced from `content/30-tasks-draft.md` — use the real titles and task_body text from that file. For `explanation_body`, use placeholder: `'Explanation coming soon — the science behind this task will be added here.'`. For `deeper_reading`, use `NULL`.
    * 30 quiz questions from `content/quiz-questions.json` (placeholder questions).
    * 8–12 notification templates (mix of push/email, varied tone_tags) — agent writes placeholder copy.
    * Default spaced_repetition_config row.
    * Admin user bootstrap: insert a profile row with `role = 'admin'` for a known test email (e.g., `admin@focuslab.local`). Document in `.env.example` that the admin must first sign up via Supabase Auth with this email, then the seed sets the role.
- Generate TypeScript types: `supabase gen types typescript --local > packages/shared/src/types/database.ts`.
- Export types from shared package.

Key files/modules:
- `supabase/migrations/00001_initial_schema.sql`
- `supabase/seed.sql`
- `content/quiz-questions.json` (placeholder questions — already exists or created here)
- `packages/shared/src/types/database.ts` (auto-generated)
- `packages/shared/src/types/index.ts` (re-exports)

Acceptance criteria:
- `supabase db reset` applies migrations + seed without errors. **[AUTO]**
- All 30 tasks are present in the `tasks` table after seeding, with `journey_id` populated. **[AUTO]**
- Quiz questions, notification templates, and SR config are seeded. **[AUTO]**
- Profile trigger works: creating a user via Supabase Auth auto-creates a profiles row (test via Supabase Studio). **[LOCAL]**
- RLS policies prevent unauthorized access (test with different user tokens). **[AUTO]**
- Community RLS allows access based on ANY journey's progress (not just current). **[AUTO]**
- Generated types compile and export correctly from shared package. **[AUTO]**

### Milestone 03 — Auth integration (Supabase Auth) [x]
Scope:
- Set up Supabase JS client in mobile app (`apps/mobile/src/lib/supabase.ts`) using `@supabase/supabase-js` + `@react-native-async-storage/async-storage` for session persistence.
- Set up Supabase JS clients in web app: server-side (`apps/web/src/lib/supabase-server.ts`) and client-side (`apps/web/src/lib/supabase-client.ts`) using `@supabase/ssr`.
- Build mobile auth screens: login (email/password), register, forgot password.
- Build web auth pages: login, register (in `apps/web/src/app/auth/`).
- **Email confirmation flow**: Supabase Auth requires email confirmation (enabled in production). Build a "Check your email" screen that appears after registration, with a "Resend confirmation" button. Handle the confirmation redirect. In local dev, Inbucket (localhost:54324) captures confirmation emails.
- Auth state management: Zustand store or React context wrapping Supabase session.
- Protected route wrappers for both mobile and web.

Key files/modules:
- `apps/mobile/src/lib/supabase.ts`
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/mobile/src/screens/auth/RegisterScreen.tsx`
- `apps/mobile/src/screens/auth/ConfirmEmailScreen.tsx`
- `apps/mobile/src/hooks/useAuth.ts`
- `apps/web/src/lib/supabase-server.ts`
- `apps/web/src/lib/supabase-client.ts`
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/register/page.tsx`
- `apps/web/src/app/auth/confirm/page.tsx`

Acceptance criteria:
- User can register with email/password on mobile and web (against local Supabase). **[LOCAL]**
- Email confirmation screen appears after registration. **[LOCAL]**
- User can login and session persists across app restart (mobile) and page refresh (web). **[LOCAL]**
- Protected screens/pages redirect unauthenticated users to login. **[AUTO]** (test with mock)
- Supabase Auth handles JWT, refresh tokens, and session management automatically. **[AUTO]**

Note: Social auth (Apple, Google) requires OAuth credentials. Implement the UI buttons but gate behind env var checks. Tag as **[CREDENTIALS]** for live testing.

### Milestone 04 — Mobile app shell + onboarding flow [x]
Scope:
- Set up navigation: bottom tab bar with 4 tabs (Journey, Community, Progress, Account) using **Expo Router** (file-based routing). See `design.md` for tab icons (lucide-react-native: compass, message-circle, bar-chart-2, user).
- Implement onboarding flow (< 60 seconds, 3 screens max): welcome screen → name entry → motivating question ("What's the one thing you'd do if you could actually focus?" — single text input, placeholder: "Write a book, learn guitar, finish my project...", max 200 chars) → redirect to Day 1 task.
- Onboarding state stored in `profiles.onboarding_complete` + `profiles.motivating_answer`.
- The motivating answer is resurfaced on Day 15 (paywall) and Day 30 (completion).
- App shell: show correct tab based on auth + onboarding state.
- NativeWind setup for styling.
- **Global error boundary**: wrap the app in an error boundary that shows a friendly "Something went wrong" screen with a retry button — never a blank white screen.

Key files/modules:
- `apps/mobile/app/` (Expo Router file-based routing)
- `apps/mobile/src/screens/onboarding/WelcomeScreen.tsx`
- `apps/mobile/src/screens/onboarding/NameScreen.tsx`
- `apps/mobile/src/screens/onboarding/MotivationScreen.tsx`
- `apps/mobile/src/components/TabBar.tsx`
- `apps/mobile/src/components/ErrorBoundary.tsx`
- `apps/mobile/tailwind.config.js`

Acceptance criteria:
- New user flow: launch → onboarding → Day 1 task. **[LOCAL]**
- Onboarding completes in < 60 seconds (3 screens max). **[MANUAL]**
- Tab navigation works across all tabs. **[LOCAL]**
- Auth state persists across app restarts. **[LOCAL]**
- NativeWind classes render correctly. **[LOCAL]**
- Error boundary catches JS errors and shows recovery UI. **[AUTO]**

### Milestone 05 — Journey engine: task display + progression [x]
Scope:
- Fetch tasks from Supabase with user's progress state (joined query: tasks + user_progress filtered by current `journey_id`).
- Build `get-journey-state` Edge Function: returns current task, streak count, progress map, reinforcement review (if any), journey metadata.
- **Timezone rule**: All time-gating uses the user's device timezone (stored in `profiles.notification_preferences.timezone`). A calendar day runs from 00:00 to 23:59:59 in the user's timezone. Completing a check-in at 23:59 counts as same day; 00:00 counts as next day.
- Render task screen: task-first layout (action above fold, explanation below, deeper reading expandable).
- Journey list showing completed / active / locked states with visual indicators (see `design.md` for node styles).
- **Multi-day task display**: When the SR algorithm extends a task, show "Day X (1 of N)" in the task card subtitle. The task card layout itself stays the same — build it so we can later add different card variants (e.g., breaking tasks into smaller steps for struggling users, based on feedback). This is V2.
- **Reinforcement review card placement**: Below the main active task card, partially visible (peeking up). User swipes up to reveal the full reinforcement review card. This creates a sense of "there's more" without overwhelming the primary task.
- Gated progression: "I did it" button triggers check-in sheet (Milestone 06).
- Time-gating: next task unlocks no earlier than the following calendar day in user's timezone (enforced server-side in `complete-check-in` Edge Function).
- Initialize user_progress rows for all 30 tasks on first journey start (task 1 = 'active', rest = 'locked'), associated with the current `journey_id`.
- **Streak calculation**: Consecutive calendar days (in user's timezone, midnight boundary) with at least one `check_ins` row. A day with zero check-ins breaks the streak.

Key files/modules:
- `supabase/functions/get-journey-state/index.ts`
- `apps/mobile/src/screens/journey/TaskScreen.tsx`
- `apps/mobile/src/screens/journey/JourneyList.tsx`
- `apps/mobile/src/screens/journey/ReviewCard.tsx`
- `apps/mobile/src/hooks/useJourneyState.ts` (TanStack Query hook calling Edge Function)
- `packages/shared/src/types/journey.ts` (JourneyState type)

Acceptance criteria:
- Active task renders with task body above fold, explanation below. **[LOCAL]**
- Locked tasks show title + lock icon, cannot be tapped into. **[LOCAL]**
- Completed tasks are reviewable (show content + check-in data). **[LOCAL]**
- Multi-day tasks display "Day X (1 of N)" subtitle. **[LOCAL]**
- Reinforcement review card peeks below main task, swipeable. **[LOCAL]**
- `get-journey-state` Edge Function returns correct data. **[AUTO]** (Deno test)
- Time-gating enforced: completing a check-in today does not unlock next task until tomorrow (user's timezone). **[AUTO]**
- Streak calculates correctly across timezone boundaries. **[AUTO]**

### Milestone 06 — Check-in system (quick + optional depth) [x]
Scope:
- Build `complete-check-in` Edge Function: validates check-in data, inserts into `check_ins` table, updates `user_progress` (marks current task completed, unlocks next if time-gate allows), creates/updates `spaced_repetition_state` for the completed task.
- Build check-in bottom sheet UI: 5 emoji faces (😫 😕 😐 🙂 🤩, mapped to 1–5), "did you try it?" pill toggle, submit button. See `design.md` for animation specs.
- Optional deeper prompts (expandable section): what happened, what was hard, what surprised you.
- Check-in history: viewable per task on the task detail screen.
- **Offline check-in with timestamp**: If no connectivity, store check-in in Zustand persist store **with the client-side timestamp** (the moment the user tapped submit). On reconnect, replay to Edge Function. The Edge Function uses the provided `checked_in_at` timestamp for time-gate calculations (not the server receive time). This ensures a check-in at 11:59 PM offline counts as that day, even if synced at 2 AM.

Key files/modules:
- `supabase/functions/complete-check-in/index.ts`
- `apps/mobile/src/screens/journey/CheckInSheet.tsx`
- `apps/mobile/src/components/EmojiRating.tsx`
- `apps/mobile/src/stores/offlineQueueStore.ts`
- `apps/mobile/src/hooks/useCheckIn.ts`

Acceptance criteria:
- Quick check-in UI takes < 10 seconds to complete. **[MANUAL]**
- Optional prompts are visible but skippable. **[LOCAL]**
- `complete-check-in` Edge Function validates and persists correctly. **[AUTO]** (Deno test)
- Check-in triggers task progression (respecting time-gate using provided timestamp). **[AUTO]**
- Offline check-ins queue with client timestamp and replay on reconnect. **[LOCAL]**

### Milestone 07 — Spaced-repetition engine [x]
Scope:
- Implement SM-2 algorithm with ADHD modifications as a pure function in `packages/shared/src/algorithm/spacedRepetition.ts`. See `architecture.md` for formula and modifications.
- Build `daily-reviews` Edge Function: reads `spaced_repetition_state` for all users, computes which tasks need review today, marks them for display in `get-journey-state`.
- Update `get-journey-state` to include today's reinforcement review task (if any).
- Build review card UI on mobile: shows past task as a lightweight reminder + mini check-in (rating only). Positioned below the active task card, swipeable (see M05).
- Admin-tunable parameters via `spaced_repetition_config` table.
- Comprehensive deterministic tests for the algorithm.

Key files/modules:
- `packages/shared/src/algorithm/spacedRepetition.ts`
- `packages/shared/src/algorithm/__tests__/spacedRepetition.test.ts`
- `supabase/functions/daily-reviews/index.ts`
- `apps/mobile/src/screens/journey/ReviewCard.tsx`

Acceptance criteria:
- Same inputs always produce same scheduling output. **[AUTO]**
- Reinforcement reviews surface at correct intervals based on algorithm. **[AUTO]**
- Struggling tasks (rating ≤ 2 or tried_it = false) trigger multi-day extension. **[AUTO]**
- Max 1 reinforcement review per day. **[AUTO]**
- Admin can change SR config via Supabase Studio (and later CMS). **[LOCAL]**
- Algorithm test file has ≥ 15 test cases covering all ADHD modifications. **[AUTO]**

### Milestone 08 — Notification engine (push + email) [NEEDS CREDENTIALS] [x]
Scope:
- Build `daily-notifications` Edge Function: iterates active users, selects channel (rotating push/email), selects template (tone diversity, recency weighting), interpolates variables, dispatches.
- **Cron trigger via pg_cron + pg_net**: pg_cron schedules a SQL job that uses the `pg_net` extension to make an HTTP POST to the `daily-notifications` Edge Function URL. pg_cron cannot call Edge Functions directly — it must go through pg_net. Add the pg_cron + pg_net setup to the migration.
- Push: send via FCM HTTP v1 API. Mobile app registers for push via `expo-notifications`, stores token in `push_tokens` table.
- Email: send via Resend API.
- Quiet hours: skip users outside their notification window (default 08:00–21:00 in user's timezone).
- Notification log: record every send in `notification_log`.
- Template rotation logic: don't repeat same tone_tag two days in a row, don't reuse same template within 7 days for a user.
- User notification preferences UI in mobile settings screen.
- **CORS headers**: All Edge Functions must return proper CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`) so the web dashboard can call them. Add a shared CORS utility function used by all Edge Functions.
- **Stub mode**: if `FCM_SERVER_KEY` or `RESEND_API_KEY` env vars are missing, log `[STUB]` warnings and skip actual sends.
- **Edge Function secrets in local dev**: Use `supabase functions serve --env-file .env.local` to pass environment variables to locally running Edge Functions. Document this in `documentation.md`.

Key files/modules:
- `supabase/functions/daily-notifications/index.ts`
- `supabase/functions/_shared/cors.ts` (shared CORS utility)
- `supabase/migrations/00002_pg_cron_notifications.sql` (pg_cron + pg_net setup)
- `apps/mobile/src/hooks/usePushNotifications.ts`
- `apps/mobile/src/screens/settings/NotificationPrefsScreen.tsx`
- Seed templates in `supabase/seed.sql` (already done in M02)

Acceptance criteria:
- Template rotation selects diverse tones and avoids recent repeats. **[AUTO]**
- Channel rotates daily per user (push → email → push...). **[AUTO]**
- Quiet hours are respected (uses user's timezone). **[AUTO]**
- Notification log is populated after each send. **[AUTO]**
- Push token registration works on mobile. **[LOCAL]**
- pg_cron job is created by migration and triggers pg_net call to Edge Function. **[AUTO]**
- CORS headers present on all Edge Function responses. **[AUTO]**
- Stub mode logs warnings and doesn't crash when credentials are missing. **[AUTO]**
- Edge Functions work locally with `--env-file .env.local`. **[LOCAL]**
- Live push/email delivery works with real credentials. **[CREDENTIALS]**

### Milestone 09 — Community: per-task discussion threads [x]
Scope:
- Mobile screens: community tab shows list of unlocked task threads; tapping opens thread with posts, replies, reactions.
- Create post, reply, react — all via direct Supabase client calls (RLS handles gating).
- **Thread unlock permanence**: Once a user unlocks a task thread (in any journey), it stays unlocked forever — even after journey restart. The RLS policy checks `user_progress` across ALL `journey_id` values, not just the current one.
- Reactions: fixed emoji set below each post: 👎 👍 🔥 ❤️ 😮. Tap to toggle. Active reaction shows count in a `green-100` pill.
- Author display: first name + day number (e.g., "Sarah — Day 12").
- Report button: inserts into `community_reports` table.
- Admin moderation page in web dashboard: view reported/all posts, hide/unhide, delete.
- Optional: Supabase Realtime subscription for live thread updates.

Key files/modules:
- `apps/mobile/src/screens/community/CommunityList.tsx`
- `apps/mobile/src/screens/community/TaskThread.tsx`
- `apps/mobile/src/components/PostCard.tsx`
- `apps/web/src/app/admin/moderation/page.tsx`

Acceptance criteria:
- Users can only see threads for tasks they've unlocked (RLS enforced). **[AUTO]** (test with two different user tokens)
- Thread access persists after journey restart. **[AUTO]** (test: restart journey, verify old threads still accessible)
- Posts, replies, and reactions create/read correctly. **[LOCAL]**
- Reported posts appear in admin moderation page. **[LOCAL]**
- Admin can hide/delete posts. **[LOCAL]**
- Non-admin users cannot hide/delete other users' posts (RLS). **[AUTO]**

### Milestone 10 — Admin CMS: task CRUD + templates + SR config [x]
Scope:
- Build admin section in web dashboard (gated by `profiles.role = 'admin'`).
- Task management: list, create, edit, reorder (drag-and-drop), delete tasks. Markdown editor for body fields (`@uiw/react-md-editor`).
- Mobile preview: render task content in a phone-shaped frame.
- Notification template management: CRUD on `notification_templates` table.
- Spaced-repetition config: edit `spaced_repetition_config` values.
- Reward bundle management: upload/link resources via Supabase Storage.
- **Make-admin CLI script**: Create `scripts/make-admin.ts` — a simple Node script that takes an email address and sets `profiles.role = 'admin'` for that user in the database. Usage: `npx tsx scripts/make-admin.ts admin@example.com`. Also document that this can be done manually via Supabase Studio SQL editor: `UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');`

Key files/modules:
- `apps/web/src/app/admin/layout.tsx` (admin layout with role check)
- `apps/web/src/app/admin/tasks/page.tsx` (task list + reorder)
- `apps/web/src/app/admin/tasks/[id]/page.tsx` (task editor)
- `apps/web/src/app/admin/templates/page.tsx`
- `apps/web/src/app/admin/settings/page.tsx` (SR config)
- `apps/web/src/app/admin/rewards/page.tsx`
- `apps/web/src/components/MobilePreview.tsx`
- `apps/web/src/components/MarkdownEditor.tsx`
- `scripts/make-admin.ts`

Acceptance criteria:
- Admin can create, edit, reorder, and delete tasks. **[LOCAL]**
- Markdown editor renders preview correctly. **[LOCAL]**
- Mobile preview shows task in phone-shaped frame. **[MANUAL]**
- Non-admin users are redirected away from admin pages. **[AUTO]**
- Notification templates CRUD works. **[LOCAL]**
- SR config update persists. **[LOCAL]**
- `make-admin.ts` script works. **[LOCAL]**

### Milestone 11 — Payment + freemium gate [NEEDS CREDENTIALS] [x]
Scope:
- Paywall screen at task 16 (layout top to bottom):
    1. User's `motivating_answer` from onboarding ("You said you wanted to: [answer]")
    2. "You've completed 15 days. The next 15 unlock:" + 3 bullet points (deeper strategies, community access for all tasks, reward bundle)
    3. Price display: "£8 one time — not a subscription" (price from RevenueCat offering; ~$10 USD equivalent in other currencies)
    4. Purchase button (primary CTA, `green-500`, full width)
    5. "Maybe later" ghost text link (dismisses paywall, user stays on Day 15)
- RevenueCat SDK integration (`react-native-purchases`): configure offerings, trigger purchase. **Requires Expo Development Build** (not Expo Go) — `react-native-purchases` is a native module.
- Build `verify-payment` Edge Function: receives RevenueCat webhook, validates, updates `profiles.payment_status = 'paid'`.
- Entitlement checking: on task navigation, check RevenueCat entitlements + `profiles.payment_status`.
- Free users see task 16 title but paywall blocks content.
- **Stub mode**: if `REVENUECAT_PUBLIC_SDK_KEY` is missing, show paywall UI with a "Dev mode: tap to unlock paid tier" button that directly sets `profiles.payment_status = 'paid'` in Supabase. This allows full flow testing without RevenueCat credentials or a dev build.

Key files/modules:
- `apps/mobile/src/screens/payment/PaywallScreen.tsx`
- `apps/mobile/src/lib/revenuecat.ts`
- `apps/mobile/src/hooks/useEntitlement.ts`
- `supabase/functions/verify-payment/index.ts`

Acceptance criteria:
- Free users are blocked at task 16 with paywall screen. **[AUTO]** (test progression logic)
- Paywall UI renders with value proposition and £8 price. **[LOCAL]**
- `verify-payment` Edge Function updates payment_status correctly. **[AUTO]** (Deno test with mock webhook)
- Dev mode bypass works when RevenueCat key is missing. **[LOCAL]**
- Live purchase flow works in sandbox with real RevenueCat credentials + Expo Dev Build. **[CREDENTIALS]**

### Milestone 12 — Progress + stats (in-app + web dashboard) [x]
Scope:
- In-app progress screen: visual journey map showing all 30 tasks with status (completed/active/locked). See `design.md` for journey node styles.
- Streak counter: consecutive days with a check-in (computed from `check_ins` table, user's timezone, midnight boundary).
- "Your journey" timeline: scrollable history of completed tasks with check-in data.
- Web dashboard user stats page: completion rate, average ratings, time per task, reinforcement history.
- `admin-analytics` Edge Function: aggregates stats across all users for admin view.

Key files/modules:
- `apps/mobile/src/screens/progress/ProgressScreen.tsx`
- `apps/mobile/src/components/JourneyMap.tsx`
- `apps/mobile/src/components/StreakBadge.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/admin/analytics/page.tsx`
- `supabase/functions/admin-analytics/index.ts`

Acceptance criteria:
- Progress map accurately reflects user state (tested with seeded data). **[LOCAL]**
- Streak counter increments/resets correctly at timezone midnight boundary. **[AUTO]** (test streak calculation logic)
- Web dashboard shows user's own stats. **[LOCAL]**
- Admin analytics page shows aggregate data. **[LOCAL]**
- `admin-analytics` Edge Function returns correct aggregations. **[AUTO]** (Deno test)

### Milestone 13 — Mindful gateway (V1: guided tutorial) [x]
Scope:
- In-app tutorial screen for setting up iOS Shortcuts / Android automation to add a 5-second breathing pause before opening trigger apps.
- Step-by-step instructions with illustrations (simple SVG or styled text cards — no screenshot assets in V1).
- Deep links to iOS Shortcuts app / Android automation settings where possible.
- "Test it now" verification step (prompt user to open a target app, check if shortcut fired).
- This is one of the 30 journey tasks (Day 17) — the task content references this tutorial screen.

Key files/modules:
- `apps/mobile/src/screens/journey/MindfulGatewayTutorial.tsx`
- `apps/mobile/src/components/StepByStepGuide.tsx`

Acceptance criteria:
- Tutorial renders with clear steps on both platforms. **[LOCAL]**
- Deep links open Shortcuts/automation settings. **[MANUAL]**
- Tutorial is accessible from the relevant journey task (Day 17). **[LOCAL]**

### Milestone 14 — Post-completion phase [x]
Scope:
- Completion screen after task 30: congratulations with user's `motivating_answer` resurfaced, stats summary, options.
- **Post-completion app state**: After Day 30, the Journey tab shows the full journey list with all 30 tasks completed and reviewable. The app does NOT show a permanent completion screen — it returns to the journey list. A "Congratulations" modal/banner appears once, then the user continues using the app normally.
- **Spaced repetition continues**: The SR algorithm keeps running post-completion. Users receive reinforcement review cards and notifications based on the algorithm, ensuring they maintain their progress long-term. The `daily-notifications` Edge Function checks if user is in post-completion state and sends reminders for algorithmically-selected past tasks.
- **Community threads remain accessible**: All 30 threads stay unlocked. User can continue posting and engaging.
- **Resources page**: A new screen accessible from the Account or Journey tab, showing curated resource links. Seed with 4 placeholder items:
    * "ADHD Focus Toolkit" (Notion template) — placeholder URL
    * "30-Day Cheatsheet" (PDF) — placeholder URL
    * "Top 10 ADHD Books" — placeholder URL
    * "Focus YouTube Channels" — placeholder URL
    Admin manages these via CMS (Supabase Storage or external links).
- Knowledge quiz: 15 questions, drawn from `content/quiz-questions.json` (placeholder content). Multiple choice (4 options, one correct). Select 15 random questions per attempt.
- Quiz result: score + recommendation ("Great retention!" or "Consider revisiting the areas you missed").
- **Restart journey**: Creates a new `journey_id`. Old `user_progress`, `check_ins`, and `spaced_repetition_state` rows remain under the old `journey_id` (history preserved). New `user_progress` rows are created for all 30 tasks under the new `journey_id`. Community thread access is NOT affected by restart (permanence rule from M09).

Key files/modules:
- `apps/mobile/src/screens/completion/CompletionScreen.tsx`
- `apps/mobile/src/screens/completion/QuizScreen.tsx`
- `apps/mobile/src/screens/completion/ResourcesScreen.tsx`
- `apps/web/src/app/admin/rewards/page.tsx` (manage resource links)

Acceptance criteria:
- Completion screen shows after task 30 check-in (once, then journey list). **[LOCAL]**
- Post-completion: journey list shows all 30 tasks, SR reviews continue. **[LOCAL]**
- Community threads remain accessible post-completion. **[AUTO]**
- Quiz generates and scores correctly. **[AUTO]** (test quiz logic)
- Resources page renders with placeholder links. **[LOCAL]**
- Restart creates new journey_id, preserves old data, community stays unlocked. **[AUTO]** (test restart logic)
- Post-completion notifications schedule correctly. **[AUTO]**

### Milestone 15 — UX polish + animations [x]
Scope:
- Spring-based animations via react-native-reanimated `withSpring`. Use exact spring configs from `design.md`: `default` (damping:15, stiffness:150), `snappy` (damping:12, stiffness:200), `gentle` (damping:20, stiffness:80), `quick` (damping:20, stiffness:300). Implement all signature motions from `design.md`.
- Confetti burst on check-in completion: `react-native-confetti-cannon` or custom Skia/reanimated particles. 15-20 colored circles, localized burst from button, 400ms. NOT full-screen.
- Haptic feedback via `expo-haptics`: see `design.md` haptics table.
- Loading skeletons for task screen, journey list, community threads. Use `moti/skeleton` or custom reanimated shimmer.
- Empty states with centered illustration + message + CTA (see `design.md`).
- Toasts: bottom-positioned (60px above tab bar), `quick` spring entrance, 3s auto-dismiss.
- Dark mode: **manual toggle** in Settings (Light / Dark / System, default Light). Store in `profiles.theme_preference`.
- Reduced motion: respect OS `prefers-reduced-motion` + manual toggle. When on: replace springs with 150ms opacity fades, disable confetti, keep haptics.
- Forgiveness UX: welcome-back banners (24–47h / 48h+ inactive). Never mention days missed. Hide streak badge if broken.
- **Error handling UX**: All network requests wrapped in try/catch with user-friendly toast messages (e.g., "Couldn't save your check-in — we'll try again when you're back online"). Never show raw error messages, stack traces, or blank screens. Use the global error boundary from M04 as the last resort.

Key files/modules:
- `apps/mobile/src/animations/springs.ts`
- `apps/mobile/src/components/ui/Toast.tsx`
- `apps/mobile/src/components/ui/Skeleton.tsx`
- `apps/mobile/src/components/ui/EmptyState.tsx`
- `apps/mobile/src/hooks/useHaptics.ts`
- `apps/mobile/src/theme/`

Acceptance criteria:
- Animations use spring physics, not linear easing. **[MANUAL]**
- Dark mode toggles correctly across all screens. **[LOCAL]**
- Reduced motion preference disables animations. **[LOCAL]**
- Empty states display helpful content. **[LOCAL]**
- Returning users see "Welcome back!" not shame. **[MANUAL]**
- Haptics fire on correct interactions. **[MANUAL]**
- Network errors show user-friendly toast, not blank screen or raw error. **[LOCAL]**

### Milestone 16 — Admin analytics + moderation dashboard [x]
Scope:
- Analytics page: active users, drop-off points (which task loses users), completion rates, popular threads, notification open rates.
- Charts/visualizations using `recharts`.
- Moderation queue: filter by reported posts, bulk actions.
- This milestone polishes the admin sections built in M10 with richer data and better UX.

Key files/modules:
- `apps/web/src/app/admin/analytics/page.tsx` (enhanced)
- `apps/web/src/components/charts/` (DropOffChart, CompletionChart, etc.)
- `apps/web/src/app/admin/moderation/page.tsx` (enhanced)

Acceptance criteria:
- Analytics dashboard shows drop-off chart by task number. **[LOCAL]**
- Completion rate and active user counts are accurate. **[AUTO]** (test aggregation logic)
- Moderation queue shows reported posts with bulk hide/delete. **[LOCAL]**
- All admin pages are role-gated. **[AUTO]**

### Milestone 17 — Testing hardening + final sweep [x]
Scope:
- Fill test coverage gaps: spaced-repetition edge cases, journey progression edge cases (including journey restart + journey_id), RLS policy tests (including community thread permanence), notification scheduling edge cases, paywall gating logic, timezone boundary tests.
- Integration tests: full auth flow (register → confirm email → login → access protected resource), full task unlock sequence (start → check-in → next task), payment verification (mock webhook), journey restart (new journey_id, old data preserved).
- Accessibility audit: contrast ratios (AA), VoiceOver/TalkBack labels, touch target sizes.
- **Security audit**: Verify no PII (emails, payment info) appears in logs. Verify RLS policies: users cannot access other users' data via any table. Verify service role key is never exposed to clients.
- Documentation finalization: update `documentation.md` to match final state.
- Final `plans.md` sweep: mark all milestones complete, verify checklist.

Key files/modules:
- Test files across all packages
- `documentation.md` (final pass)
- `plans.md` (final verification)

Acceptance criteria:
- All tests pass: `npx turbo lint && npx turbo typecheck && npx turbo test`. **[AUTO]**
- Accessibility meets AA standard. **[MANUAL]**
- App launch to current task < 2 seconds. **[MANUAL]**
- Animations at 60fps. **[MANUAL]**
- No PII in any log output (grep logs for email patterns). **[AUTO]**
- RLS isolation verified: user A cannot read user B's check-ins, progress, or notifications. **[AUTO]**
- `documentation.md` is accurate and complete. **[MANUAL]**
- All milestones in this file are checked off. **[AUTO]**

### Milestone 18 — Phase 0: UX bug fixes [x]
Scope:
- Replace community `PrimaryButton` reactions with `ReactionPill` component (smaller pill shape, `AnimatedPressable`, `EmojiText` for proper emoji rendering).
- Fix reaction toggle logic: track active state per-user via `reaction.user_id === user?.id` instead of `count > 0`.
- De-emphasize Report button: replace `PrimaryButton` with ghost `Pressable` in muted `gray-400` text.
- Fix username casing: remove `uppercase tracking-[2px]` from author name display.

Key files/modules:
- `apps/mobile/src/components/ReactionPill.tsx` (new)
- `apps/mobile/src/components/ui/EmojiText.tsx` (new)
- `apps/mobile/src/components/ui/PrimaryButton.tsx` (updated)
- `apps/mobile/src/screens/community/CommunityScreen.tsx` (updated)

Acceptance criteria:
- Emoji renders in full color on iOS (not monochrome). **[LOCAL]**
- Reaction pills are visually distinct from primary CTA buttons. **[MANUAL]**
- Active reaction shows green-500 bg; inactive shows green-200/dark-border bg. **[LOCAL]**
- Report button is muted text, not a green button. **[MANUAL]**
- Author names display in natural case. **[LOCAL]**

### Milestone 19 — Phase 1: Data model (interaction_type + interaction_config) [ ]
Scope:
- Add `interaction_type` enum and `interaction_config` JSONB column to `tasks` table via SQL migration.
- Regenerate TypeScript types from schema.
- Update shared domain types (`TaskRow`, `JourneyTaskState`).
- Update admin CMS task editor with interaction_type dropdown and JSON config editor.
- See `.claude/change-phase1.md` for full spec.

Key files/modules:
- `supabase/migrations/00004_task_interaction_type.sql` (new)
- `packages/shared/src/types/database.ts` (regenerated)
- `packages/shared/src/types/domain.ts` (updated)
- `apps/web/src/app/admin/tasks/[id]/page.tsx` (updated)
- `apps/web/src/app/admin/tasks/page.tsx` (updated)

Acceptance criteria:
- Migration applies cleanly via `supabase db reset`. **[AUTO]**
- All existing tasks default to `interaction_type = 'markdown'`. **[AUTO]**
- Admin CMS shows interaction_type dropdown and config editor. **[LOCAL]**
- `turbo typecheck` passes after type regeneration. **[AUTO]**

### Milestone 20 — Phase 2: Interactive task renderers [ ]
Scope:
- Create `TaskRenderer` component that switches on `interaction_type`.
- Implement 6 interactive task type components (DragListTask, TimedChallengeTask, BreathingExerciseTask, ReflectionPromptsTask, JournalTask, CommunityPromptTask).
- Gate "I did it" button until interactive component signals completion.
- Pass interaction data through to check-in.
- See `.claude/change-phase2.md` for full spec.

Key files/modules:
- `apps/mobile/src/components/tasks/TaskRenderer.tsx` (new)
- `apps/mobile/src/components/tasks/DragListTask.tsx` (new)
- `apps/mobile/src/components/tasks/TimedChallengeTask.tsx` (new)
- `apps/mobile/src/components/tasks/BreathingExerciseTask.tsx` (new)
- `apps/mobile/src/components/tasks/ReflectionPromptsTask.tsx` (new)
- `apps/mobile/src/components/tasks/JournalTask.tsx` (new)
- `apps/mobile/src/components/tasks/CommunityPromptTask.tsx` (new)
- `apps/mobile/src/screens/journey/JourneyScreen.tsx` (updated)

Acceptance criteria:
- Each interactive type renders correctly and gates completion. **[LOCAL]**
- "I did it" button is disabled until interaction is complete. **[LOCAL]**
- Interaction data is passed to check-in `prompt_responses.interaction_data`. **[LOCAL]**
- `turbo typecheck` passes. **[AUTO]**

### Milestone 21 — Phase 3: Journey map overhaul + micro-feedback [ ]
Scope:
- Redesign `JourneyMap` to serpentine winding path with alternating node positions.
- Animated active node (pulsing border, START badge), completed node jiggle, dashed locked nodes.
- Day-unlock reveal animation with haptics.
- Streak badge overhaul: always visible, dimmed at 0, animated increment.
- Comprehensive haptics audit across all screens.
- See `.claude/change-phase3.md` for full spec.

Key files/modules:
- `apps/mobile/src/components/JourneyMap.tsx` (rewritten)
- `apps/mobile/src/components/JourneyMapNode.tsx` (new)
- `apps/mobile/src/components/StreakBadge.tsx` (updated)

Acceptance criteria:
- Journey map renders serpentine layout with curved SVG lines. **[LOCAL]**
- Active node pulses, completed nodes jiggle, locked nodes are dashed circles. **[MANUAL]**
- Streak badge visible at count 0 with dimmed styling. **[LOCAL]**
- Haptics fire on all key interactions (see design.md table). **[MANUAL]**

### Milestone 22 — Phase 4: Done-for-today improvements [ ]
Scope:
- Add progress ring (animated SVG circle, N/30) to done-for-today state.
- Add rotating motivational quote (deterministic per local date).
- Upgrade review card presentation (use EmojiRating, not number buttons).
- Dynamic heading based on streak count.
- See `.claude/change-phase4.md` for full spec.

Key files/modules:
- `apps/mobile/src/components/ProgressRing.tsx` (new)
- `apps/mobile/src/constants/motivation.ts` (new)
- `apps/mobile/src/screens/journey/JourneyScreen.tsx` (updated)

Acceptance criteria:
- Progress ring renders with animated fill. **[LOCAL]**
- Motivational quote changes daily, stable within a day. **[LOCAL]**
- Review card uses EmojiRating component. **[LOCAL]**
- Heading changes with streak: "Done for today" / "Building momentum" / "On fire". **[LOCAL]**

### Milestone 23 — Phase 5+6: Content format + account polish [ ]
Scope:
- Assign interaction_type to all 30 tasks (no two consecutive same type).
- Add interaction-type hint icons on journey map for unlocked nodes.
- Admin CMS type distribution summary + consecutive-type warning.
- Account screen: segmented control for theme, Switch toggles for notifications, sign-out, delete account, dark mode card border fix.
- See `.claude/change-phase5.md` and `.claude/change-phase6.md` for full specs.

Key files/modules:
- `supabase/migrations/00005_seed_interaction_types.sql` (new)
- `apps/mobile/src/components/ui/SegmentedControl.tsx` (new)
- `apps/mobile/src/screens/account/AccountScreen.tsx` (updated)
- `apps/mobile/src/components/ui/AppCard.tsx` (updated)
- `apps/web/src/app/admin/tasks/page.tsx` (updated)

Acceptance criteria:
- All 30 tasks have an interaction_type assigned, no consecutive duplicates. **[AUTO]**
- Journey map shows type hint icons on unlocked nodes. **[LOCAL]**
- Admin CMS shows distribution summary and warns on consecutive same-type. **[LOCAL]**
- Segmented control works for theme selection. **[LOCAL]**
- Sign-out and delete-account are accessible on Account screen. **[LOCAL]**
- Dark mode card borders are more visible. **[MANUAL]**

## Risk register (top technical risks + mitigations)

### 1) User retention — ADHD users abandon apps quickly
- Risk: Users download, try Day 1, and never return.
- Mitigation: Novelty-driven notifications (varied templates, channel rotation), spaced reinforcement creates "unfinished business" psychology, community accountability, gated progression creates anticipation. Post-completion SR keeps users engaged after Day 30.

### 2) Spaced-repetition tuning
- Risk: Algorithm is too aggressive (overwhelms user) or too passive (user forgets past tasks).
- Mitigation: Conservative defaults, admin-tunable parameters via `spaced_repetition_config`, monitor review completion rates in analytics dashboard, adjust in real-time.

### 3) Notification deliverability
- Risk: Push notifications silenced by OS, emails land in spam.
- Mitigation: Follow platform best practices (notification channels on Android, provisional auth on iOS), FCM (well-supported), Resend (good deliverability), monitor open rates in `notification_log`, offer multiple channels.

### 4) Payment integration complexity
- Risk: IAP is complex, receipt validation has edge cases (refunds, family sharing, sandbox vs production).
- Mitigation: RevenueCat handles all receipt validation, entitlement management, and cross-platform syncing. Dev mode bypass for testing without credentials. Dramatically reduces risk vs building from scratch.

### 5) Community moderation
- Risk: Toxic posts, spam, or harmful content in discussion threads.
- Mitigation: Report button, admin moderation queue, RLS ensures content gating, start with manual moderation given small initial user base. Add word filter in V2 if needed.

### 6) Offline/sync conflicts
- Risk: User submits check-in offline, then again on another device before sync.
- Mitigation: Check-ins are append-only (no conflict). Offline check-ins include client-side timestamp for accurate time-gating. Progression uses server (Edge Function) as source of truth. Offline queue replays with idempotent check.

### 7) Supabase Edge Function limitations
- Risk: Edge Functions have cold starts, 60s timeout, limited runtime (Deno).
- Mitigation: Keep functions small and focused. Heavy computation batched. Algorithm is a pure function in shared package. Monitor execution times.

### 8) Community RLS performance at scale
- Risk: The `EXISTS (SELECT 1 FROM user_progress ...)` subquery in community RLS runs on every row read.
- Mitigation: Fine for V1 (100 users). When approaching 1k+, add a composite GIN index on `user_progress(user_id, task_id, status)`. This is a migration-only change — zero app code changes, zero data loss.

### 9) Error handling and blank screens
- Risk: Unhandled errors crash the app or show blank white screens, causing users to abandon.
- Mitigation: Global error boundary (M04), try/catch on all network calls with user-friendly toasts (M15), TanStack Query error states with retry UI, offline queue prevents data loss.

## Retention strategy

Every feature in FocusLab is designed to combat the specific ways ADHD users disengage:

### Problem: "I forgot the app exists"
- **Solution**: Varied push notifications (novelty prevents notification blindness), email as backup channel, post-completion SR reminders keep the app relevant after Day 30. V2 adds home screen widget as passive reminder.

### Problem: "I got bored of it"
- **Solution**: Notification template rotation (different tone/emoji/framing each day), spaced reinforcement (past tasks reappear in new context), community threads (social content changes daily), micro-animation novelty.

### Problem: "I feel guilty for missing days and don't want to open the app"
- **Solution**: Forgiveness UX ("Welcome back!" not "You missed 3 days"), no streak-shaming (streak shown as positive reinforcement, absence never highlighted), journey picks up where you left off.

### Problem: "I rushed through and didn't learn anything"
- **Solution**: Time-gating (one task per day minimum), spaced reinforcement (algorithm forces review), multi-day task extension (struggling users can't skip ahead), check-in requirement (forces minimal engagement).

### Problem: "The content is the same every time I open the app"
- **Solution**: Active task changes daily, reinforcement reviews add variety, community threads have fresh content, notifications use different copy/tone each day.

### Problem: "I finished and now there's nothing to do"
- **Solution**: Post-completion spaced repetition keeps content alive, community threads remain accessible, resources page provides ongoing value, notification reminders continue, knowledge quiz for self-assessment, option to restart. V2 adds mindful gateway ("one sec" style app intercept) to keep daily engagement post-completion.

### Problem: "I can't focus long enough to read the explanation"
- **Solution**: Task-first layout (action above fold, 1–2 sentences max), explanation below the fold and optional, deeper reading explicitly expandable, no walls of text.

## Architecture overview

See `architecture.md` for the full technical architecture. Key decisions:

### Backend
- **Supabase** replaces a custom API server. CRUD operations use the Supabase JS client directly. Business logic lives in Edge Functions.
- **No apps/api/ directory**, no ORM, no Redis, no custom auth middleware.
- **pg_cron + pg_net** for scheduled jobs: pg_cron triggers a SQL job that uses pg_net to HTTP POST to Edge Function URLs. This is the only way to trigger Edge Functions on a schedule from within Supabase.
- **CORS**: All Edge Functions return proper CORS headers so both mobile and web clients can call them.

### Data model
- Profiles (extends auth.users), tasks, user_progress, check_ins, spaced_repetition_state, community_posts/reactions/replies/reports, notification_log/templates, spaced_repetition_config, push_tokens, quiz_questions.
- **`journey_id`** on tasks, user_progress, check_ins, spaced_repetition_state — enables journey restart while preserving history.
- All tables have RLS policies. Schema managed via SQL migrations. Types auto-generated from Postgres schema.

### Auth
- Supabase Auth handles everything: email/password, email confirmation, OAuth (Apple, Google), JWT, refresh tokens, rate limiting.
- **Email confirmation enabled** — app includes a "Check your email" screen after registration.
- App stores session in AsyncStorage (mobile) / cookies (web).

### Timezone handling
- All time-sensitive operations (time-gating, streak calculation, notification scheduling, quiet hours) use the user's device timezone stored in `profiles.notification_preferences.timezone`.
- Calendar day boundary: 00:00:00 to 23:59:59 in the user's timezone.
- Check-in at 23:59 = same day. Check-in at 00:00 = next day.

### Spaced-repetition algorithm
- SM-2 based with ADHD modifications (shorter initial intervals, struggle detection, multi-day extension, review cap, decay boost).
- Pure function in `packages/shared/` — no DB deps, fully testable.
- Admin-tunable via `spaced_repetition_config` table.
- **Continues post-completion**: after Day 30, the algorithm keeps scheduling reviews to maintain progress.

### Notification engine
- `daily-notifications` Edge Function: triggered via pg_cron → pg_net, selects channel (rotating), selects template (tone diversity), interpolates variables, sends via FCM/Resend.
- Quiet hours enforcement (user's timezone).
- Stubs when credentials are missing.

### Payment
- RevenueCat SDK handles StoreKit + Google Play Billing + receipt validation + entitlements.
- **Price: £8 one-time** (~$10 USD equivalent). Configured in RevenueCat dashboard.
- `verify-payment` Edge Function receives webhook and updates DB.
- Dev mode bypass for testing without credentials.
- **Requires Expo Development Build** — not compatible with Expo Go.

### Offline strategy
- TanStack Query caches reads. Zustand + persist queues offline check-ins **with client-side timestamps**.
- Server (Edge Functions) is source of truth for progression.
- Offline check-in timestamp is used for time-gate calculation, not server receive time.

### Error handling
- Global error boundary catches unhandled JS errors → friendly recovery screen.
- All network calls wrapped in try/catch → user-friendly toast messages.
- TanStack Query provides error/retry states for all server data.
- Offline queue prevents data loss during connectivity issues.
- Never show raw errors, stack traces, or blank screens to users.

### Security
- Auth handled entirely by Supabase Auth (bcrypt, JWT, refresh tokens, rate limiting).
- All tables use Row Level Security — each user can only see their own data.
- **Never log PII**: no user emails, passwords, or payment details in any log output.
- Community posts sanitized for XSS.
- Admin CMS behind role check in RLS policies.
- Payment entitlements validated server-side by RevenueCat (never trust client).
- Supabase encrypts data at rest. Service role key never exposed to clients.
- GDPR-ready: Supabase supports data export; add delete-account Edge Function that cascades.

## V2 Features (not in V1 — keep architecture extensible)

These features are explicitly deferred. Do NOT build them, but keep the codebase structured so they can be added without major refactoring.

- **Home screen widget** (iOS WidgetKit + Android Glance): Progress ring, streak, task title, tap-to-open deep link. Requires native Swift/Kotlin code. Widget reads from shared app storage written by the RN app. Will use an Expo config plugin or custom native module.
- **Native mindful gateway** ("one sec" style): App-intercept overlay that shows a 5-second breathing pause before opening YouTube/TikTok/Instagram/games. Timed check-ins at 10min/30min. This is the primary post-completion engagement feature. Requires Accessibility Service (Android) / Screen Time API (iOS).
- **Work hub desktop mode**: Task breakdown, break reminders, white noise, focus timer — for users who keep the web app open while working.
- **"Not relevant" skip option**: Allow users to skip a task that doesn't apply to them with a "Not relevant to me" button. Algorithm adjusts and moves to the next task. Based on user feedback.
- **Adaptive task cards**: Different card layouts for struggling users — breaking tasks into smaller steps based on check-in feedback.
- **SMS notifications**: Additional channel via Twilio.
- **Multiple journeys**: Anxiety, motivation, etc. — `journey_id` column is already in place.
- **AI-powered insights**: Analyze check-in patterns for personalized recommendations.
- **Advanced community**: Word filter, auto-moderation, trending posts, user profiles.

## Implementation notes and decision log (updated as we go)

- 2026-03-17: Repository started with spec files, content files, and Supabase config only. Bootstrap is being done from scratch against the locked stack in `architecture.md`.
- 2026-03-17: Using a manual monorepo scaffold instead of generator defaults where helpful so the workspace, linting, tests, and shared package structure stay consistent across Expo, Next.js, and Supabase from day one.
- 2026-03-17: `react-native-purchases` does not expose a usable Expo config plugin in this environment, so the mobile app keeps the dependency installed but omits it from `app.config.ts`. RevenueCat SDK wiring will be handled in app code during the payment milestone.
- 2026-03-17: Local `supabase start` fails when the bundled Edge Runtime tries to fetch a remote Deno standard library import with an invalid local certificate chain. Milestone 01 verification used `supabase start --exclude edge-runtime` and confirmed the rest of the local Supabase stack boots successfully.
- 2026-03-17: Local `npx turbo dev` verification required an unsandboxed run because this shell sandbox blocks port binding and Expo writes to `~/.expo`. Mobile scripts now redirect Expo state into `/tmp/focuslab-expo-home`.
- 2026-03-17: Milestone 02 verification succeeded with `supabase db reset`, generated database types, 30 seeded tasks, 30 quiz questions, 10 notification templates, and 1 spaced repetition config row.
- 2026-03-17: The auth profile trigger was verified end-to-end by creating a local auth user via the Supabase Auth API and confirming a matching `public.profiles` row was created with the expected name.
- 2026-03-17: Milestone 03 added Supabase auth clients on mobile and web, login/register/confirm/reset screens, and protected route helpers. Local web smoke checks returned `200` for `/auth/login` and `307` redirect from `/dashboard` to `/auth/login` while signed out.
- 2026-03-17: NativeWind runtime was already configured, but TypeScript prop augmentation was missing. Adding local RN module augmentation in `apps/mobile/nativewind-env.d.ts` restored `className` support without rewriting the new mobile UI to `StyleSheet` syntax.
- 2026-03-17: Journey progression, check-in transitions, notification selection, quiz scoring, and restart payload generation were centralized in `packages/shared` so both the mobile fallback paths and Supabase Edge Functions use the same deterministic domain rules.
- 2026-03-17: Admin CMS implementation uses a server-gated `/admin` layout with browser-client CRUD pages instead of server actions to keep iteration fast while still relying on Supabase RLS for enforcement. Task ordering is implemented with explicit move up/down controls rather than drag-and-drop.
- 2026-03-17: Added `reward_resources` as a first-class table plus seed data so the mobile Resources screen and admin Rewards page are backed by Supabase rather than hardcoded constants. The mobile screen still falls back to shared defaults if the query fails.
- 2026-03-17: RevenueCat integration is wrapped in lazy-loaded helpers so Expo Go/dev mode can continue working when the native module key is absent. The paywall uses a direct Supabase dev unlock when `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY` is missing.
- 2026-03-17: `supabase functions serve --env-file .env.local` still fails before project code boots because the local Edge Runtime rejects `https://deno.land/std/http/status.ts` with `invalid peer certificate: UnknownIssuer`. This remains an environment/runtime blocker and should not be treated as an application-code regression.
- 2026-03-17: Milestone 15 is only partially complete in this pass. Error boundaries, toasts, welcome-back copy, theme preference persistence, and friendlier network failure handling are in place, but a full dark-mode token system and the larger animation/haptics pass still need finishing.
- 2026-03-17: Milestone 15 completed — dark mode tokens on all screens, 4 spring configs, 5 haptic types, reduced motion support, skeleton shimmer.
- 2026-03-17: Milestone 17 completed — 13 mobile unit tests, 29 EF equivalence tests, final dark mode sweep on QuizScreen/MindfulGateway/JourneyHomeScreen/MarkdownBlock.
- 2026-03-20: Expo runtime fixes committed — pinned all wildcard deps, added react-native-svg, downgraded React 19.2.4→19.2.0 for RN 0.83, added App.tsx entry point + expo-router/babel plugin, linked shared package via file: protocol. Stubbed useReducedMotion to get Expo running (must restore before release). Bypassed auth email confirmation for local testing (must revert before deploy).
- 2026-03-20: Phase 0 (Milestone 18) completed — ReactionPill component, EmojiText for iOS emoji rendering, PrimaryButton non-string children support, ghost report button, natural-case usernames, per-user reaction toggle fix.
- 2026-03-20: Done-for-today state added to JourneyScreen — renders when no current task + nextUnlockDate exists. Two cards: "unlocks tomorrow" + "open community" CTA. This is the base for Phase 4 enhancements.
- 2026-03-20: Phase doc corrections applied — EF domain.ts imports types from shared package (no manual duplication needed), testing should use dev build not Expo Go, motivation quote uses locale-aware date, review card already renders in done-for-today state.
