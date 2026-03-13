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
- [ ] `npx turbo lint`
- [ ] `npx turbo typecheck`
- [ ] `npx turbo test`
- [ ] `supabase db reset` (verify migrations + seed apply cleanly)
- Last verified: not yet started

## Milestones (executed in order)

Each milestone includes scope, key files/modules, acceptance criteria (tagged with verification category), and verification steps. Categories: **[AUTO]**, **[LOCAL]**, **[MANUAL]**, **[CREDENTIALS]** — see `implement.md` for definitions.

### Milestone 01 — Repo scaffold + tooling foundation [ ]
Scope:
- Initialize Turborepo monorepo with three workspaces: `apps/mobile` (Expo), `apps/web` (Next.js), `packages/shared`.
- Initialize Supabase project (`supabase init`) in repo root — creates `supabase/` directory.
- Set up TypeScript (strict), ESLint, Prettier across all workspaces.
- Set up testing: Vitest for `packages/shared` and `apps/web`, Jest for `apps/mobile`.
- Create `.env.example` with all required environment variables (from `architecture.md`).
- Create root `turbo.json` with `dev`, `build`, `lint`, `typecheck`, `test` pipelines.
- Verify shared package imports correctly from both apps.

Key files/modules:
- `package.json` (root workspace config)
- `turbo.json`
- `apps/mobile/` — Expo project (`npx create-expo-app`)
- `apps/web/` — Next.js project (`npx create-next-app`)
- `packages/shared/package.json` + `src/index.ts`
- `supabase/config.toml`
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

### Milestone 02 — Database schema + migrations + seed data [ ]
Scope:
- Write SQL migration(s) creating all tables from `architecture.md`: profiles, tasks, user_progress, check_ins, spaced_repetition_state, community_posts, community_reactions, community_replies, notification_log, notification_templates, spaced_repetition_config, push_tokens.
- Write database trigger: auto-create `profiles` row when a new `auth.users` row is inserted.
- Write RLS policies for all tables (as specified in `architecture.md`).
- Write `supabase/seed.sql` with: 30 placeholder tasks (order 1–30, with realistic titles and placeholder markdown bodies), 8–12 notification templates (mix of push/email, varied tone_tags), default spaced_repetition_config row.
- Generate TypeScript types: `supabase gen types typescript --local > packages/shared/src/types/database.ts`.
- Export types from shared package.

Key files/modules:
- `supabase/migrations/00001_initial_schema.sql`
- `supabase/seed.sql`
- `packages/shared/src/types/database.ts` (auto-generated)
- `packages/shared/src/types/index.ts` (re-exports)

Acceptance criteria:
- `supabase db reset` applies migrations + seed without errors. **[AUTO]**
- All 30 tasks are present in the `tasks` table after seeding. **[AUTO]**
- Notification templates and SR config are seeded. **[AUTO]**
- Profile trigger works: creating a user via Supabase Auth auto-creates a profiles row (test via `supabase/seed.sql` or manual Studio check). **[LOCAL]**
- RLS policies prevent unauthorized access (test with different user tokens). **[AUTO]**
- Generated types compile and export correctly from shared package. **[AUTO]**

### Milestone 03 — Auth integration (Supabase Auth) [ ]
Scope:
- Set up Supabase JS client in mobile app (`apps/mobile/src/lib/supabase.ts`) using `@supabase/supabase-js` + `@react-native-async-storage/async-storage` for session persistence.
- Set up Supabase JS clients in web app: server-side (`apps/web/src/lib/supabase-server.ts`) and client-side (`apps/web/src/lib/supabase-client.ts`) using `@supabase/ssr`.
- Build mobile auth screens: login (email/password), register, forgot password.
- Build web auth pages: login, register (in `apps/web/src/app/auth/`).
- Auth state management: Zustand store or React context wrapping Supabase session.
- Protected route wrappers for both mobile and web.

Key files/modules:
- `apps/mobile/src/lib/supabase.ts`
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/mobile/src/screens/auth/RegisterScreen.tsx`
- `apps/mobile/src/hooks/useAuth.ts`
- `apps/web/src/lib/supabase-server.ts`
- `apps/web/src/lib/supabase-client.ts`
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/register/page.tsx`

Acceptance criteria:
- User can register with email/password on mobile and web (against local Supabase). **[LOCAL]**
- User can login and session persists across app restart (mobile) and page refresh (web). **[LOCAL]**
- Protected screens/pages redirect unauthenticated users to login. **[AUTO]** (test with mock)
- Supabase Auth handles JWT, refresh tokens, and session management automatically — no custom auth middleware. **[AUTO]**

Note: Social auth (Apple, Google) requires OAuth credentials. Implement the UI buttons but gate behind env var checks. Tag as **[CREDENTIALS]** for live testing.

### Milestone 04 — Mobile app shell + onboarding flow [ ]
Scope:
- Set up navigation: bottom tab bar (Journey, Community, Progress, Settings) using Expo Router or React Navigation.
- Implement onboarding flow (< 60 seconds): welcome screen → name entry → one motivating question → redirect to Day 1 task.
- Onboarding state stored in `profiles.onboarding_complete` + `profiles.motivating_answer`.
- App shell: show correct tab based on auth + onboarding state.
- NativeWind setup for styling.

Key files/modules:
- `apps/mobile/src/navigation/` (or `apps/mobile/app/` if using Expo Router)
- `apps/mobile/src/screens/onboarding/WelcomeScreen.tsx`
- `apps/mobile/src/screens/onboarding/NameScreen.tsx`
- `apps/mobile/src/screens/onboarding/MotivationScreen.tsx`
- `apps/mobile/src/components/TabBar.tsx`
- `apps/mobile/tailwind.config.js`

Acceptance criteria:
- New user flow: launch → onboarding → Day 1 task. **[LOCAL]**
- Onboarding completes in < 60 seconds (3 screens max). **[MANUAL]**
- Tab navigation works across all tabs. **[LOCAL]**
- Auth state persists across app restarts. **[LOCAL]**
- NativeWind classes render correctly. **[LOCAL]**

### Milestone 05 — Journey engine: task display + progression [ ]
Scope:
- Fetch tasks from Supabase with user's progress state (joined query: tasks + user_progress).
- Build `get-journey-state` Edge Function: returns current task, streak count, progress map, reinforcement review (if any).
- Render task screen: task-first layout (action above fold, explanation below, deeper reading expandable).
- Journey list showing completed / active / locked states with visual indicators.
- Gated progression: "I did it" button triggers check-in sheet (Milestone 06).
- Time-gating: next task unlocks no earlier than the following calendar day (enforced server-side).
- Initialize user_progress rows for all 30 tasks on first journey start (task 1 = 'active', rest = 'locked').

Key files/modules:
- `supabase/functions/get-journey-state/index.ts`
- `apps/mobile/src/screens/journey/TaskScreen.tsx`
- `apps/mobile/src/screens/journey/JourneyList.tsx`
- `apps/mobile/src/hooks/useJourneyState.ts` (TanStack Query hook calling Edge Function)
- `packages/shared/src/types/journey.ts` (JourneyState type)

Acceptance criteria:
- Active task renders with task body above fold, explanation below. **[LOCAL]**
- Locked tasks show title + lock icon, cannot be tapped into. **[LOCAL]**
- Completed tasks are reviewable (show content + check-in data). **[LOCAL]**
- `get-journey-state` Edge Function returns correct data. **[AUTO]** (test with Deno test)
- Time-gating enforced: completing a check-in today does not unlock next task until tomorrow. **[AUTO]**

### Milestone 06 — Check-in system (quick + optional depth) [ ]
Scope:
- Build `complete-check-in` Edge Function: validates check-in data, inserts into `check_ins` table, updates `user_progress` (marks current task completed, unlocks next if time-gate allows), creates/updates `spaced_repetition_state` for the completed task.
- Build check-in bottom sheet UI: emoji/1-5 rating selector, "did you try it?" toggle, submit button.
- Optional deeper prompts (expandable section): what happened, what was hard, what surprised you.
- Check-in history: viewable per task on the task detail screen.
- Offline queue: if no connectivity, store check-in in Zustand persist store, replay on reconnect.

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
- Check-in triggers task progression (respecting time-gate). **[AUTO]**
- Offline check-ins queue and replay on reconnect. **[LOCAL]**

### Milestone 07 — Spaced-repetition engine [ ]
Scope:
- Implement SM-2 algorithm with ADHD modifications as a pure function in `packages/shared/src/algorithm/spacedRepetition.ts`. See `architecture.md` for formula and modifications.
- Build `daily-reviews` Edge Function: reads `spaced_repetition_state` for all users, computes which tasks need review today, marks them in a `reinforcement_reviews` concept (could be a computed field or separate lightweight table/view).
- Update `get-journey-state` to include today's reinforcement review task (if any).
- Build review card UI on mobile: shows past task as a lightweight reminder + mini check-in (rating only).
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

### Milestone 08 — Notification engine (push + email) [NEEDS CREDENTIALS] [ ]
Scope:
- Build `daily-notifications` Edge Function: cron-triggered, iterates active users, selects channel (rotating push/email), selects template (tone diversity, recency weighting), interpolates variables, dispatches.
- Push: send via FCM HTTP v1 API. Mobile app registers for push via `expo-notifications`, stores token in `push_tokens` table.
- Email: send via Resend API.
- Quiet hours: skip users outside their notification window.
- Notification log: record every send in `notification_log`.
- Template rotation logic: don't repeat same tone_tag two days in a row, don't reuse same template within 7 days for a user.
- User notification preferences UI in mobile settings screen.
- **Stub mode**: if `FCM_SERVER_KEY` or `RESEND_API_KEY` env vars are missing, log `[STUB]` warnings and skip actual sends.

Key files/modules:
- `supabase/functions/daily-notifications/index.ts`
- `apps/mobile/src/hooks/usePushNotifications.ts`
- `apps/mobile/src/screens/settings/NotificationPrefsScreen.tsx`
- Seed templates in `supabase/seed.sql` (already done in M02)

Acceptance criteria:
- Template rotation selects diverse tones and avoids recent repeats. **[AUTO]**
- Channel rotates daily per user (push → email → push...). **[AUTO]**
- Quiet hours are respected. **[AUTO]**
- Notification log is populated after each send. **[AUTO]**
- Push token registration works on mobile. **[LOCAL]**
- Stub mode logs warnings and doesn't crash when credentials are missing. **[AUTO]**
- Live push/email delivery works with real credentials. **[CREDENTIALS]**

### Milestone 09 — Community: per-task discussion threads [ ]
Scope:
- Mobile screens: community tab shows list of unlocked task threads; tapping opens thread with posts, replies, reactions.
- Create post, reply, react (emoji) — all via direct Supabase client calls (RLS handles gating).
- Author display: first name + day number (e.g., "Sarah — Day 12").
- Report button: inserts a report record (or flags the post).
- Admin moderation page in web dashboard: view reported/all posts, hide/unhide, delete.
- Optional: Supabase Realtime subscription for live thread updates.

Key files/modules:
- `apps/mobile/src/screens/community/CommunityList.tsx`
- `apps/mobile/src/screens/community/TaskThread.tsx`
- `apps/mobile/src/components/PostCard.tsx`
- `apps/web/src/app/admin/moderation/page.tsx`

Acceptance criteria:
- Users can only see threads for tasks they've unlocked (RLS enforced). **[AUTO]** (test with two different user tokens)
- Posts, replies, and reactions create/read correctly. **[LOCAL]**
- Reported posts appear in admin moderation page. **[LOCAL]**
- Admin can hide/delete posts. **[LOCAL]**
- Non-admin users cannot hide/delete other users' posts (RLS). **[AUTO]**

### Milestone 10 — Admin CMS: task CRUD + templates + SR config [ ]
Scope:
- Build admin section in web dashboard (gated by `profiles.role = 'admin'`).
- Task management: list, create, edit, reorder (drag-and-drop), delete tasks. Markdown editor for body fields.
- Mobile preview: render task content in a phone-shaped frame.
- Notification template management: CRUD on `notification_templates` table.
- Spaced-repetition config: edit `spaced_repetition_config` values.
- Reward bundle management: upload/link resources via Supabase Storage.

Key files/modules:
- `apps/web/src/app/admin/layout.tsx` (admin layout with role check)
- `apps/web/src/app/admin/tasks/page.tsx` (task list + reorder)
- `apps/web/src/app/admin/tasks/[id]/page.tsx` (task editor)
- `apps/web/src/app/admin/templates/page.tsx`
- `apps/web/src/app/admin/settings/page.tsx` (SR config)
- `apps/web/src/app/admin/rewards/page.tsx`
- `apps/web/src/components/MobilePreview.tsx`
- `apps/web/src/components/MarkdownEditor.tsx`

Acceptance criteria:
- Admin can create, edit, reorder, and delete tasks. **[LOCAL]**
- Markdown editor renders preview correctly. **[LOCAL]**
- Mobile preview shows task in phone-shaped frame. **[MANUAL]**
- Non-admin users are redirected away from admin pages. **[AUTO]**
- Notification templates CRUD works. **[LOCAL]**
- SR config update persists. **[LOCAL]**

### Milestone 11 — Payment + freemium gate [NEEDS CREDENTIALS] [ ]
Scope:
- Paywall screen at task 16: value proposition, testimonials placeholder, purchase button.
- RevenueCat SDK integration (`react-native-purchases`): configure offerings, trigger purchase.
- Build `verify-payment` Edge Function: receives RevenueCat webhook, validates, updates `profiles.payment_status = 'paid'`.
- Entitlement checking: on task navigation, check RevenueCat entitlements + `profiles.payment_status`.
- Free users see task 16 title but paywall blocks content.
- **Stub mode**: if `REVENUECAT_PUBLIC_SDK_KEY` is missing, show paywall UI but skip actual purchase flow with a "dev mode" bypass button.

Key files/modules:
- `apps/mobile/src/screens/payment/PaywallScreen.tsx`
- `apps/mobile/src/lib/revenuecat.ts`
- `apps/mobile/src/hooks/useEntitlement.ts`
- `supabase/functions/verify-payment/index.ts`

Acceptance criteria:
- Free users are blocked at task 16 with paywall screen. **[AUTO]** (test progression logic)
- Paywall UI renders with value proposition. **[LOCAL]**
- `verify-payment` Edge Function updates payment_status correctly. **[AUTO]** (Deno test with mock webhook)
- Dev mode bypass works when RevenueCat key is missing. **[LOCAL]**
- Live purchase flow works in sandbox with real RevenueCat credentials. **[CREDENTIALS]**

### Milestone 12 — Progress + stats (in-app + web dashboard) [ ]
Scope:
- In-app progress screen: visual journey map / progress bar showing all 30 tasks with status (completed/active/locked).
- Streak counter: consecutive days with a check-in (computed from `check_ins` table).
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
- Streak counter increments/resets correctly. **[AUTO]** (test streak calculation logic)
- Web dashboard shows user's own stats. **[LOCAL]**
- Admin analytics page shows aggregate data. **[LOCAL]**
- `admin-analytics` Edge Function returns correct aggregations. **[AUTO]** (Deno test)

### Milestone 13 — Home screen widget (iOS + Android) [NEEDS CREDENTIALS] [ ]
Scope:
- iOS WidgetKit widget: progress ring, streak, task title, tap-to-open deep link.
- Android Glance/AppWidget: same display.
- Widget data flow: `get-journey-state` response → app writes to shared storage → widget reads from shared storage.
- `expo-shared-preferences` or native module for shared storage bridge.
- Widget refreshes on task unlock + periodic WidgetKit timeline / WorkManager.

Key files/modules:
- `apps/mobile/ios/Widget/` (WidgetKit Swift extension)
- `apps/mobile/android/app/src/main/java/.../widget/` (Kotlin/Java)
- `apps/mobile/src/hooks/useWidgetUpdate.ts`

Acceptance criteria:
- Widget code exists for both platforms. **[AUTO]** (compiles)
- Widget displays day/30, streak, task title. **[MANUAL]** (requires native build)
- Tapping widget deep links to current task. **[MANUAL]**
- Widget data updates on task unlock. **[MANUAL]**

Note: Widgets require native builds (EAS Build or local Xcode/Android Studio). Cannot be tested in Expo Go. Tag fully as **[MANUAL]**.

### Milestone 14 — Mindful gateway (V1: guided tutorial) [ ]
Scope:
- In-app tutorial screen for setting up iOS Shortcuts / Android automation.
- Step-by-step instructions with illustrations (can use simple SVG or styled text cards — no need for screenshot assets in V1).
- Deep links to iOS Shortcuts app / Android automation settings where possible.
- "Test it now" verification step (prompt user to open a target app, check if shortcut fired).
- This is one of the 30 journey tasks — the task content references this tutorial screen.

Key files/modules:
- `apps/mobile/src/screens/journey/MindfulGatewayTutorial.tsx`
- `apps/mobile/src/components/StepByStepGuide.tsx`

Acceptance criteria:
- Tutorial renders with clear steps on both platforms. **[LOCAL]**
- Deep links open Shortcuts/automation settings. **[MANUAL]**
- Tutorial is accessible from the relevant journey task. **[LOCAL]**

### Milestone 15 — Post-completion phase [ ]
Scope:
- Completion screen after task 30: congratulations, stats summary, options.
- Knowledge quiz: 10–15 questions drawn from the 30 tasks (questions stored in Supabase or hardcoded in V1).
- Quiz result: score + recommendation (restart or maintain).
- Reward bundle screen: links to digital resources stored in Supabase Storage or external URLs (Notion boards, cheatsheet, book list, YouTube channels).
- "Restart journey" option: resets user_progress and spaced_repetition_state.
- Post-completion random task reminders: `daily-notifications` Edge Function checks if user is in post-completion state and sends reminder for a random past task.

Key files/modules:
- `apps/mobile/src/screens/completion/CompletionScreen.tsx`
- `apps/mobile/src/screens/completion/QuizScreen.tsx`
- `apps/mobile/src/screens/completion/RewardScreen.tsx`
- `apps/web/src/app/admin/rewards/page.tsx` (manage reward links)

Acceptance criteria:
- Completion screen shows after task 30 check-in. **[LOCAL]**
- Quiz generates and scores correctly. **[AUTO]** (test quiz logic)
- Reward bundle links are accessible. **[LOCAL]**
- Restart resets progress and begins at task 1. **[AUTO]** (test reset logic)
- Post-completion reminders are included in notification scheduling. **[AUTO]**

### Milestone 16 — UX polish + animations [ ]
Scope:
- Spring-based animations via react-native-reanimated: task card entrance, check-in completion pop, progress bar fill, day unlock.
- Haptic feedback via `expo-haptics`: light tap on check-in, medium on task unlock, success on day completion.
- Loading skeletons for task screen, journey list, community threads.
- Empty states: no tasks yet, no community posts, no check-in history.
- Toasts for success/error feedback.
- Dark mode: implement using NativeWind dark variant + Supabase user preference.
- Reduced motion: respect OS `prefers-reduced-motion`, fall back to opacity fades.
- Forgiveness UX: "Welcome back!" message for returning users after inactivity.

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

### Milestone 17 — Admin analytics + moderation dashboard [ ]
Scope:
- Analytics page: active users, drop-off points (which task number loses users), completion rates, popular discussion threads, notification open rates.
- Charts/visualizations (use a simple charting lib like recharts).
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

### Milestone 18 — Testing hardening + final sweep [ ]
Scope:
- Fill test coverage gaps: spaced-repetition edge cases, journey progression edge cases, RLS policy tests, notification scheduling edge cases, paywall gating logic.
- Integration tests: full auth flow (register → login → access protected resource), full task unlock sequence (start → check-in → next task), payment verification (mock webhook).
- Accessibility audit: contrast ratios (AA), VoiceOver/TalkBack labels, touch target sizes.
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
- `documentation.md` is accurate and complete. **[MANUAL]**
- All milestones in this file are checked off. **[AUTO]**

## Risk register (top technical risks + mitigations)

### 1) User retention — ADHD users abandon apps quickly
- Risk: Users download, try Day 1, and never return.
- Mitigation: Novelty-driven notifications (varied templates, channel rotation), home screen widget as passive reminder, spaced reinforcement to create "unfinished business" psychology, community accountability, gated progression that creates anticipation. See Retention Strategy section.

### 2) Spaced-repetition tuning
- Risk: Algorithm is too aggressive (overwhelms user) or too passive (user forgets past tasks).
- Mitigation: Conservative defaults, admin-tunable parameters via `spaced_repetition_config`, monitor review completion rates in analytics dashboard, adjust in real-time.

### 3) Notification deliverability
- Risk: Push notifications silenced by OS, emails land in spam.
- Mitigation: Follow platform best practices (notification channels on Android, provisional auth on iOS), use FCM (well-supported), Resend (good deliverability), monitor open rates in `notification_log`, offer multiple channels.

### 4) Cross-platform widget
- Risk: WidgetKit and Android widgets have very different APIs and constraints.
- Mitigation: Keep widget simple (read-only, no interaction beyond tap), abstract data layer behind shared storage, accept visual differences between platforms. Widget is a "nice to have" — core retention comes from notifications and the journey itself.

### 5) Payment integration
- Risk: IAP is complex, receipt validation has edge cases (refunds, family sharing, sandbox vs production).
- Mitigation: RevenueCat handles all receipt validation, entitlement management, and cross-platform syncing. Dramatically reduces risk vs building from scratch. Free tier covers our needs.

### 6) Community moderation
- Risk: Toxic posts, spam, or harmful content in discussion threads.
- Mitigation: Report button, admin moderation queue, RLS ensures content gating, start with manual moderation given small initial user base. Add word filter in V2 if needed.

### 7) Offline/sync conflicts
- Risk: User submits check-in offline, then again on another device before sync.
- Mitigation: Check-ins are append-only (no conflict), progression uses server (`complete-check-in` Edge Function) as source of truth, offline queue replays with idempotent check.

### 8) Supabase Edge Function limitations
- Risk: Edge Functions have cold starts, 60s timeout, limited runtime (Deno).
- Mitigation: Keep functions small and focused. Heavy computation (like daily-notifications for many users) can be batched. Algorithm is a pure function in shared package, not an Edge Function. Monitor execution times.

## Retention strategy

Every feature in FocusLab is designed to combat the specific ways ADHD users disengage:

### Problem: "I forgot the app exists"
- **Solution**: Home screen widget (passive, always-visible progress), varied push notifications (novelty prevents notification blindness), email as backup channel.

### Problem: "I got bored of it"
- **Solution**: Notification template rotation (different tone, emoji, framing every day), spaced reinforcement (past tasks reappear in new context), community threads (social content changes daily), micro-animation novelty (subtle variation in daily UI).

### Problem: "I feel guilty for missing days and don't want to open the app"
- **Solution**: Forgiveness UX ("Welcome back!" not "You missed 3 days"), no streak-shaming (streak is shown as positive reinforcement, absence is never highlighted), the journey picks up where you left off (no punishment).

### Problem: "I rushed through and didn't learn anything"
- **Solution**: Time-gating (one task per day minimum), spaced reinforcement (algorithm forces review), multi-day task extension (struggling users can't skip ahead), check-in requirement (forces at least minimal engagement).

### Problem: "The content is the same every time I open the app"
- **Solution**: Active task changes daily, reinforcement reviews add variety, community threads have fresh content, notifications use different copy/tone each day.

### Problem: "I finished and now there's nothing to do"
- **Solution**: Post-completion phase with random task reminders, knowledge quiz for self-assessment, reward bundle as completion incentive, option to restart.

### Problem: "I can't focus long enough to read the explanation"
- **Solution**: Task-first layout (action above fold, 1–2 sentences max), explanation is below the fold and optional, deeper reading is explicitly expandable, no walls of text anywhere in the core flow.

## Architecture overview

See `architecture.md` for the full technical architecture. Key decisions:

### Backend
- **Supabase** replaces a custom API server. CRUD operations use the Supabase JS client directly. Business logic lives in Edge Functions.
- **No apps/api/ directory**, no ORM, no Redis, no custom auth middleware.

### Data model
- Profiles (extends auth.users), tasks, user_progress, check_ins, spaced_repetition_state, community_posts/reactions/replies, notification_log/templates, spaced_repetition_config, push_tokens.
- All tables have RLS policies. Schema managed via SQL migrations.
- Types auto-generated from Postgres schema.

### Auth
- Supabase Auth handles everything: email/password, OAuth (Apple, Google), JWT, refresh tokens, rate limiting.
- App stores session in AsyncStorage (mobile) / cookies (web).

### Spaced-repetition algorithm
- SM-2 based with ADHD modifications (shorter initial intervals, struggle detection, multi-day extension, review cap, decay boost).
- Pure function in `packages/shared/` — no DB deps, fully testable.
- Admin-tunable via `spaced_repetition_config` table.

### Notification engine
- `daily-notifications` Edge Function: cron-triggered, selects channel (rotating), selects template (tone diversity), interpolates variables, sends via FCM/Resend.
- Quiet hours enforcement.
- Stubs when credentials are missing.

### Payment
- RevenueCat SDK handles StoreKit + Google Play Billing + receipt validation + entitlements.
- `verify-payment` Edge Function receives webhook and updates DB.

### Offline strategy
- TanStack Query caches reads. Zustand + persist queues offline check-ins.
- Server (Edge Functions) is source of truth for progression.

### Widget
- `get-journey-state` response → app writes to shared storage → widget reads from shared storage.
- Refreshes on task unlock + periodic schedule.

## Implementation notes and decision log (updated as we go)

(This section will be populated as milestones are implemented.)
