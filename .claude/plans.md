# FocusLab Implementation Plan

This document is the complete execution plan, risk register, retention strategy, and architecture overview. We will implement milestone by milestone, validating each step with lint, typecheck, and tests.

Guiding principles:
- Retention over flash: every feature must justify itself by how it keeps ADHD users coming back.
- Task-first UX: the actionable task is always the first thing visible. Explanation is secondary.
- Algorithm-driven: spaced repetition adapts to each user, not a fixed schedule.
- Content-managed: tasks are authored via CMS, not hardcoded.

## Verification checklist (kept current)

Core commands (run after every milestone):
- [ ] lint
- [ ] typecheck
- [ ] test
- Last verified: not yet started

## Milestones (executed in order)

Each milestone includes scope, key files/modules, acceptance criteria, and verification steps.

### Milestone 01 - Repo scaffold + tooling foundation [ ]
Scope:
- Initialize monorepo structure (mobile app, web dashboard, backend API, shared types).
- Set up TypeScript, linting, testing framework, and CI config.
- Establish path aliases, shared type packages, and base folder structure.
- Finalize tech stack decision and document in Implementation Notes.

Key files/modules:
- `package.json` (root workspace)
- `apps/mobile/` — React Native / Expo project
- `apps/web/` — Next.js or Vite + React dashboard
- `apps/api/` — Backend API project
- `packages/shared/` — shared TypeScript types and utilities
- `tsconfig.json` (root + per-app configs)
- Linting and formatting config

Acceptance criteria:
- Monorepo installs cleanly.
- Each app starts in dev mode.
- Shared types import correctly across apps.
- Lint/typecheck/test run (even if minimal).

Verification commands:
- Install + dev start for each app
- Lint, typecheck, test across workspace

### Milestone 02 - Backend API scaffold + database schema [ ]
Scope:
- Set up backend framework (Node.js + Express/Fastify or equivalent).
- Define database schema (users, tasks, progress, check-ins, community, notifications, spaced-repetition state).
- Set up ORM/query builder and migrations.
- Set up Redis for session/cache if needed.
- Seed database with placeholder task data.

Key files/modules:
- `apps/api/src/server.ts`
- `apps/api/src/db/schema.ts` or migrations directory
- `apps/api/src/db/seed.ts`
- `packages/shared/src/types/` — shared model types

Acceptance criteria:
- Database migrations run successfully.
- Seed script populates 30 placeholder tasks.
- API starts and responds to health check.

### Milestone 03 - Auth system (email/password + social) [ ]
Scope:
- Implement registration, login, token refresh, and profile endpoints.
- Support email/password and social auth (Apple, Google) — at minimum email/password for V1.
- JWT-based auth with refresh tokens.
- Rate limiting on auth endpoints.
- Mobile + web auth flows.

Key files/modules:
- `apps/api/src/routes/auth.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/services/authService.ts`
- `apps/mobile/src/screens/auth/`
- `apps/web/src/pages/auth/`

Acceptance criteria:
- User can register, login, and receive tokens.
- Protected endpoints reject unauthenticated requests.
- Token refresh works.
- Auth screens render on mobile and web.

### Milestone 04 - Admin CMS: task CRUD + preview [ ]
Scope:
- Build admin panel in web dashboard (role-gated).
- CRUD for tasks: create, read, update, delete, reorder.
- Markdown editor for task body, explanation, and deeper reading.
- Mobile preview mode (shows how a task will render on phone).
- Task fields: title, body, explanation, deeper reading, difficulty, duration, tags, active flag.

Key files/modules:
- `apps/api/src/routes/admin/tasks.ts`
- `apps/web/src/pages/admin/TaskEditor.tsx`
- `apps/web/src/pages/admin/TaskList.tsx`
- `apps/web/src/components/MobilePreview.tsx`

Acceptance criteria:
- Admin can create, edit, reorder, and delete tasks.
- Task preview matches intended mobile layout.
- Non-admin users cannot access admin routes.

### Milestone 05 - Mobile app shell + onboarding flow [ ]
Scope:
- Build mobile app shell: bottom tab navigation, screen structure.
- Implement onboarding flow (< 60 seconds): name entry, one motivating question, straight to Day 1.
- Auth integration (login/register screens).
- App shell shows: Journey tab, Community tab, Progress tab, Settings tab.

Key files/modules:
- `apps/mobile/src/navigation/`
- `apps/mobile/src/screens/onboarding/`
- `apps/mobile/src/screens/auth/`
- `apps/mobile/src/components/TabBar.tsx`

Acceptance criteria:
- New user flows: launch → onboarding → Day 1 task in < 60 seconds.
- Tab navigation works across all shells.
- Auth state persists across app restarts.

### Milestone 06 - Journey engine: task display + progression [ ]
Scope:
- Fetch tasks from API with user progress state.
- Render task screen: task-first layout (action above fold, explanation below, deeper reading expandable).
- Journey list showing completed / active / locked states.
- Gated progression: "Mark as done" triggers check-in flow.
- Time-gating: next task unlocks no earlier than the following calendar day.

Key files/modules:
- `apps/api/src/routes/tasks.ts`
- `apps/api/src/routes/progress.ts`
- `apps/api/src/services/journeyService.ts`
- `apps/mobile/src/screens/journey/TaskScreen.tsx`
- `apps/mobile/src/screens/journey/JourneyList.tsx`
- `packages/shared/src/types/task.ts`
- `packages/shared/src/types/progress.ts`

Acceptance criteria:
- Active task renders with correct layout hierarchy.
- Locked tasks show but cannot be accessed.
- Completed tasks are reviewable.
- Next task does not unlock until the following day.

### Milestone 07 - Check-in system (quick + optional depth) [ ]
Scope:
- Build check-in flow: quick rating (emoji/1-5) + "did you try it?" toggle.
- Optional deeper prompts (what happened, what was hard, what surprised you).
- Check-in submission unlocks next task (respecting time gate).
- Check-in history stored and accessible.
- Offline queue: check-ins submitted offline sync when connectivity returns.

Key files/modules:
- `apps/api/src/routes/progress.ts` (check-in endpoint)
- `apps/api/src/services/checkInService.ts`
- `apps/mobile/src/screens/journey/CheckInSheet.tsx`
- `apps/mobile/src/stores/offlineQueue.ts`

Acceptance criteria:
- Quick check-in takes < 10 seconds.
- Optional prompts are skippable.
- Check-in submission triggers task progression.
- Offline check-ins sync correctly on reconnect.

### Milestone 08 - Spaced-repetition engine [ ]
Scope:
- Implement SM-2 based algorithm with ADHD modifications.
- Track per-user per-task: ease factor, interval, review count, next review date.
- Daily job computes reinforcement reviews for each user.
- Reinforcement appears as a lightweight review card on the journey screen.
- Multi-day task extension when struggle is detected.
- Admin-tunable parameters (base interval, ease floor, struggle threshold, max reviews/day, decay multiplier).

Key files/modules:
- `apps/api/src/services/spacedRepetitionService.ts`
- `apps/api/src/jobs/dailyReviewJob.ts`
- `apps/api/src/routes/progress.ts` (reinforcement endpoints)
- `apps/mobile/src/screens/journey/ReviewCard.tsx`
- `packages/shared/src/algorithm/spacedRepetition.ts`
- `packages/shared/src/algorithm/__tests__/spacedRepetition.test.ts`

Acceptance criteria:
- Same inputs produce same scheduling output (deterministic tests).
- Reinforcement reviews surface at correct intervals.
- Struggling tasks extend to multi-day.
- Max 1 reinforcement review per day.
- Admin can tune parameters via CMS.

### Milestone 09 - Notification engine (push + email) [ ]
Scope:
- Push notification infrastructure (APNs + FCM).
- Email service integration (SendGrid, Resend, or equivalent).
- Template system with variable interpolation.
- Daily notification job: selects channel (rotating), selects template (tone diversity), sends.
- Quiet hours enforcement.
- User notification preferences (channels, quiet hours, timezone).
- Device token registration endpoint.

Key files/modules:
- `apps/api/src/services/notificationService.ts`
- `apps/api/src/jobs/dailyNotificationJob.ts`
- `apps/api/src/routes/notifications.ts`
- `apps/api/src/db/templates/` (seed notification templates)
- `apps/web/src/pages/admin/NotificationTemplates.tsx`

Acceptance criteria:
- Push notifications deliver to iOS and Android.
- Email notifications deliver with varied templates.
- Channel rotates daily (not both on same day).
- Tone tags don't repeat consecutively.
- Quiet hours are respected.
- Admin can manage templates via CMS.

### Milestone 10 - Community: per-task discussion threads [ ]
Scope:
- Per-task discussion threads, gated by task unlock.
- Create posts, reply, react (emoji).
- Author display: first name + day number.
- Report button for moderation.
- Admin moderation in CMS (view, hide/delete posts).

Key files/modules:
- `apps/api/src/routes/community.ts`
- `apps/api/src/services/communityService.ts`
- `apps/mobile/src/screens/community/TaskThread.tsx`
- `apps/mobile/src/screens/community/CommunityList.tsx`
- `apps/web/src/pages/admin/Moderation.tsx`

Acceptance criteria:
- Users can only see threads for tasks they've unlocked.
- Posts, replies, and reactions work.
- Reported posts appear in admin moderation queue.
- Admin can hide/delete posts.

### Milestone 11 - Payment + freemium gate [ ]
Scope:
- Paywall screen at task 16 with value proposition.
- In-app purchase integration (StoreKit for iOS, Google Play Billing for Android).
- Server-side receipt validation.
- Entitlement checking on task access.
- Graceful handling: free users can see task 16 title but not content.

Key files/modules:
- `apps/api/src/routes/payment.ts`
- `apps/api/src/services/paymentService.ts`
- `apps/mobile/src/screens/payment/PaywallScreen.tsx`
- `apps/mobile/src/services/iapService.ts`

Acceptance criteria:
- Free users are blocked at task 16 with paywall screen.
- Purchase flow works on both platforms (sandbox/test mode).
- Receipt validation confirms entitlement.
- Paid users access tasks 16–30 seamlessly.

### Milestone 12 - Progress + stats (in-app + web dashboard) [ ]
Scope:
- In-app journey map / progress bar showing all 30 tasks with status.
- Streak counter and streak display.
- "Your journey" timeline with check-in history.
- Web dashboard user stats: completion rate, average ratings, time per task, reinforcement history.

Key files/modules:
- `apps/mobile/src/screens/progress/ProgressScreen.tsx`
- `apps/mobile/src/components/JourneyMap.tsx`
- `apps/mobile/src/components/StreakBadge.tsx`
- `apps/web/src/pages/dashboard/UserStats.tsx`
- `apps/api/src/routes/progress.ts` (stats endpoints)

Acceptance criteria:
- Progress map accurately reflects user state.
- Streak counter increments/resets correctly.
- Web dashboard shows aggregate stats for admin view.
- User can view their own history on web.

### Milestone 13 - Home screen widget (iOS + Android) [ ]
Scope:
- iOS WidgetKit widget: progress ring, streak, task title, tap-to-open.
- Android Glance/AppWidget: same display.
- Data flow: API → app → shared storage → widget.
- Widget refreshes on task unlock and periodic schedule.

Key files/modules:
- `apps/mobile/ios/Widget/` (WidgetKit extension)
- `apps/mobile/android/app/src/main/java/.../widget/`
- `apps/api/src/routes/widget.ts`
- `apps/mobile/src/services/widgetService.ts`

Acceptance criteria:
- Widget displays current day/30, streak, and task title on both platforms.
- Tapping widget opens app to current task.
- Widget updates when a new task is unlocked.

### Milestone 14 - Mindful gateway (V1: guided tutorial) [ ]
Scope:
- In-app tutorial screen for setting up iOS Shortcuts / Android automation.
- Step-by-step instructions with screenshots/illustrations.
- Deep links to Shortcuts app / automation settings where possible.
- "Test it now" verification step.
- This is one of the 30 journey tasks (authored in CMS).

Key files/modules:
- `apps/mobile/src/screens/journey/MindfulGatewayTutorial.tsx`
- `apps/mobile/src/components/StepByStepGuide.tsx`
- Static assets: tutorial screenshots/illustrations

Acceptance criteria:
- Tutorial is clear and followable on both iOS and Android.
- Deep links work where supported.
- Tutorial is integrated as a journey task via CMS content.

### Milestone 15 - Post-completion phase [ ]
Scope:
- After task 30: random task reminders via notifications.
- Knowledge quiz: 10–15 questions drawn from the 30 tasks.
- Quiz result: score + recommendation (restart or maintain).
- Reward bundle: screen with links to digital resources (Notion boards, cheatsheet, book list, YouTube channels).
- Option to restart the journey.

Key files/modules:
- `apps/api/src/services/postCompletionService.ts`
- `apps/api/src/routes/quiz.ts`
- `apps/mobile/src/screens/completion/QuizScreen.tsx`
- `apps/mobile/src/screens/completion/RewardScreen.tsx`
- `apps/mobile/src/screens/completion/CompletionScreen.tsx`
- `apps/web/src/pages/admin/RewardBundle.tsx`

Acceptance criteria:
- Post-completion users receive random task reminders.
- Quiz generates correctly and scores accurately.
- Reward bundle is accessible after completion.
- Restart resets progress and begins at task 1.

### Milestone 16 - UX polish + animations [ ]
Scope:
- Spring-based animations for task cards, check-in, progress, and unlocks.
- Haptic feedback on key interactions.
- Empty states, toasts, and loading skeletons.
- Dark mode support.
- Reduced motion support.
- Forgiveness UX: "Welcome back!" for returning users, no shame on missed days.

Key files/modules:
- `apps/mobile/src/animations/`
- `apps/mobile/src/components/ui/Toast.tsx`
- `apps/mobile/src/theme/`
- `apps/mobile/src/hooks/useHaptics.ts`

Acceptance criteria:
- Animations feel bouncy and quick (spring physics, not linear).
- Dark mode works across all screens.
- Reduced motion preference is respected.
- Empty states are helpful, not blank.
- Returning users see encouragement, not guilt.

### Milestone 17 - Admin analytics + moderation dashboard [ ]
Scope:
- Aggregate analytics: active users, drop-off points (which task loses users), completion rates, popular threads.
- Moderation queue: reported posts with hide/delete actions.
- Notification template management UI.
- Spaced-repetition parameter tuning UI.
- Reward bundle content management.

Key files/modules:
- `apps/web/src/pages/admin/Analytics.tsx`
- `apps/web/src/pages/admin/Moderation.tsx`
- `apps/web/src/pages/admin/Settings.tsx`
- `apps/api/src/routes/admin/analytics.ts`

Acceptance criteria:
- Analytics dashboard shows actionable retention data.
- Drop-off chart identifies which tasks lose users.
- Admin can tune all configurable parameters.

### Milestone 18 - Testing hardening + final sweep [ ]
Scope:
- Comprehensive unit tests for: spaced-repetition, journey progression, check-in validation, notification scheduling, paywall gating.
- Integration tests for: auth flow, full task unlock sequence, payment verification.
- Accessibility audit: contrast, screen reader, touch targets.
- Performance audit: app launch time, animation frame rate.
- Documentation finalization.

Key files/modules:
- Test files across all apps
- `documentation.md` (final pass)
- `plans.md` (final verification)

Acceptance criteria:
- All tests pass.
- Accessibility meets AA standard.
- App launch to current task < 2 seconds.
- Animations at 60fps.
- Documentation is accurate and complete.

## Risk register (top technical risks + mitigations)

### 1) User retention — ADHD users abandon apps quickly
- Risk: Users download, try Day 1, and never return.
- Mitigation: Novelty-driven notifications (varied templates, channel rotation), home screen widget as passive reminder, spaced reinforcement to create "unfinished business" psychology, community accountability, gated progression that creates anticipation. See Retention Strategy section.

### 2) Spaced-repetition tuning
- Risk: Algorithm is too aggressive (overwhelms user) or too passive (user forgets past tasks).
- Mitigation: Conservative defaults, admin-tunable parameters, A/B testing infrastructure (V2), monitor review completion rates in analytics dashboard.

### 3) Notification deliverability
- Risk: Push notifications silenced by OS, emails land in spam.
- Mitigation: Follow platform best practices (notification channels on Android, provisional auth on iOS), monitor delivery rates, keep email sending domain warm, offer multiple channels.

### 4) Cross-platform widget
- Risk: WidgetKit and Android widgets have very different APIs and constraints.
- Mitigation: Keep widget simple (read-only, no interaction beyond tap), abstract data layer behind shared storage, accept visual differences between platforms.

### 5) Payment integration
- Risk: App Store / Google Play IAP is complex, receipt validation has edge cases (refunds, family sharing, sandbox vs production).
- Mitigation: Use a library like RevenueCat or build minimal receipt validation, test thoroughly in sandbox, handle edge cases gracefully (re-validate on app launch).

### 6) Community moderation
- Risk: Toxic posts, spam, or harmful content in discussion threads.
- Mitigation: Report button, admin moderation queue, consider basic word filter, start with manual moderation given small initial user base.

### 7) Offline/sync conflicts
- Risk: User submits check-in offline, then again on another device before sync.
- Mitigation: Check-ins are append-only (no conflict), progression uses server as source of truth, offline queue syncs with idempotent operations.

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

### Data model
- Users, tasks, progress, check-ins, community posts, notification logs, spaced-repetition state.
- Tasks are admin-authored via CMS, stored in database, fetched by mobile app.
- Progress tracks per-user per-task state with unlock timestamps and algorithm metadata.

### API design
- RESTful JSON API with JWT auth.
- Resource groups: auth, tasks, progress, community, notifications, payment, admin.
- Rate limiting on auth and community endpoints.

### Spaced-repetition algorithm
- SM-2 based with ADHD-specific modifications (shorter initial intervals, struggle detection, multi-day extension, review cap, decay boost).
- Admin-tunable parameters.
- Deterministic: same inputs always produce same scheduling output.

### Notification engine
- Daily per-user job: select channel (rotating), select template (tone diversity), interpolate variables, send.
- Quiet hours enforcement.
- Push (APNs + FCM) + email for V1.

### Payment
- In-app purchase (StoreKit + Google Play Billing).
- Server-side receipt validation.
- Entitlement stored on user record.

### Offline strategy
- Current task and check-in history cached locally.
- Check-ins queued offline and synced on reconnect.
- Server is source of truth for progression.

### Widget
- Lightweight API endpoint → app caches to shared storage → widget reads from shared storage.
- Refreshes on task unlock + periodic schedule.

## Implementation notes and decision log (updated as we go)

(This section will be populated as milestones are implemented.)
