You are acting as a senior staff engineer and tech lead. Build FocusLab — a mobile-first ADHD journey app that guides users through a 30-task sequential program designed to build lasting focus habits.

Core goals

* User retention is the #1 priority. ADHD users lose interest in apps quickly. Every design and engineering decision must serve engagement and stickiness.
* The app must feel alive — spring-based animations (see `design.md` for exact `withSpring` configs) that are fast enough to not bore an ADHD brain but polished enough to feel premium.
* This is not a journaling app, not a quote-of-the-day app. It is an active, structured behavioral program with spaced reinforcement, gated progression, and community accountability.
* You will plan first, then implement milestone by milestone. Do not skip the planning phase.

Hard requirements

* Platforms: iOS + Android via React Native + Expo (primary), Next.js web dashboard (secondary — admin CMS + user stats/history).
* Auth + cloud sync from day 1 via Supabase Auth. Users must be able to switch devices seamlessly.
* Freemium model: first 15 tasks free (no payment info required), tasks 16–30 require a flat one-time purchase (£8 / ~$10 USD) via RevenueCat.
* Push notifications (FCM via expo-notifications) + email (Resend) for V1 with varied templates/copy to exploit ADHD novelty-seeking.
* Admin CMS for the owner to create, edit, and reorder task content without code changes.
* Email confirmation enabled for auth (Supabase Auth). App includes "Check your email" screen after registration.
* Every milestone must include verification steps (tests, lint, typecheck).

Tech stack (locked — see `architecture.md` for full details)

* Mobile: React Native + Expo (SDK 52+), Expo Router (file-based routing), NativeWind, Zustand, TanStack Query, react-native-reanimated
* Web: Next.js 14+ (App Router), Tailwind CSS, TanStack Query
* Backend: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime). No custom API server — CRUD via Supabase JS client, business logic via Edge Functions.
* Push: Firebase Cloud Messaging (FCM) via expo-notifications
* Email: Resend
* Payments: RevenueCat (react-native-purchases)
* Monorepo: Turborepo
* Testing: Vitest (shared + web), Jest + RNTL (mobile), Deno test (Edge Functions)
* Types: auto-generated from Postgres schema via `supabase gen types typescript`

Deliverable
A repo that contains:

* Working mobile apps (iOS + Android) implementing the features below
* A responsive web dashboard (admin CMS + user-facing stats)
* Supabase project config: migrations, seed data, Edge Functions, RLS policies
* Shared package: auto-generated DB types + spaced-repetition algorithm
* Architecture docs explaining the data model, API design, spaced-repetition algorithm, and notification engine
* Scripts: dev, build, test, lint, typecheck (via Turborepo)
* A `plans.md` file capturing the full implementation plan and ongoing notes
* A `.env.example` with all required environment variables documented

Product spec (build this)

A) Journey engine — the core loop

* 30 sequential tasks, unlocked one at a time
* Each task page shows:
    * The task itself — immediately visible, above the fold, no scrolling required. Tasks are **interactive, not just readable** — the app renders a purpose-built mini-experience based on the task's `interaction_type` (see section Q).
    * Below the fold: explanation of why this task matters (the science/reasoning)
    * Below that: optional deeper reading / related concepts
* Gated progression: user must complete the interactive portion of the task AND a reflection check-in to unlock the next task. The "I did it" button is disabled until the interactive component signals completion.
* Time-gating: next task unlocks no earlier than the following day (prevents binge-rushing)
* Multi-day tasks: the spaced-repetition algorithm can extend a task across multiple days if the user's check-in signals struggle
* Reinforcement days: the algorithm periodically resurfaces past tasks for review (Anki-style spacing)
* Post-completion phase (after task 30):
    * Random task reminders to prevent regression
    * Reward bundle: digital resources (Notion boards, cheatsheet PDF, curated ADHD book list, YouTube channel recs)
    * Knowledge quiz based on the 30 tasks (helps users self-assess if they need to restart)
    * Option to restart the journey

B) Reflection + check-in system

* Required to unlock: one quick check-in. Must take < 10 seconds.
    * Rating: 5 emoji faces in a horizontal row: 😫 😕 😐 🙂 🤩 (mapped to values 1–5 internally). Tapping one highlights it with a scale animation (see `design.md` for spring config). NOT a slider, NOT numeric buttons.
    * "Did you try it?" pill-shaped toggle (green-500 when on, green-200 when off).
    * Submit button.
* Optional depth: 2–3 structured prompts (what happened, what was hard, what surprised you) with short text fields. Expandable section below the quick check-in — visible but skippable.
* Deeper reflections are stored and visible in the user's history on the web dashboard.
* The spaced-repetition algorithm uses check-in data (rating, completion signal, time spent) to adjust reinforcement timing.

C) Spaced-repetition engine

* Algorithm-driven (inspired by SM-2 / Anki) resurfacing of past tasks
* Inputs: check-in rating, days since task, number of reviews, user-reported difficulty
* Outputs: which past task to resurface and when, whether current task should extend to multi-day
* Reinforcement appears as a lightweight "review card" — not a full redo, but a quick reminder + mini check-in
* Must be tunable: admin can set base intervals, difficulty multipliers, and max review frequency via `spaced_repetition_config` table
* Algorithm is a pure function in `packages/shared/src/algorithm/spacedRepetition.ts` — no database deps, fully testable

D) Notification engine — novelty-driven engagement

* Push notifications (FCM) with rotating templates/copy (different tone, different emoji, different framing each day)
* Email (Resend) digests with varied headers and layouts (not the same template every time)
* One notification channel per day (not all at once — push today, email tomorrow, etc.)
* Notification content is context-aware: references the user's current task, days active, streak
* Quiet hours respect + user-configurable notification preferences (stored in `profiles.notification_preferences`)
* Templates stored in `notification_templates` table, managed via admin CMS
* Scheduling via `daily-notifications` Edge Function triggered by pg_cron → pg_net (see `architecture.md` for setup)
* V2 roadmap: SMS, richer novelty (different notification sounds, widget animations)

E) Onboarding

* < 60 seconds total: 3 screens max (welcome → name → motivating question → Day 1 task).
* Motivating question: "What's the one thing you'd do if you could actually focus?"
    * Single text input, placeholder: "Write a book, learn guitar, finish my project..."
    * Max 200 characters. Stored in `profiles.motivating_answer`.
    * The app resurfaces this answer on Day 15 (paywall — personalized hook) and Day 30 (completion — reminder of why they started).
* After onboarding, set `profiles.onboarding_complete = true` and redirect to Journey tab.

F) Mindful gateway (V1: guided setup)

* V1: in-app tutorial that walks users through setting up iOS Shortcuts / Android automation to add a 5-second breathing pause before opening "brain rot" apps (YouTube, TikTok, Instagram, games)
* Tutorial includes step-by-step screenshots, deep links where possible, and a "test it now" verification step
* V2 roadmap: native app-intercept with breathing overlay + timed check-ins at 10min/30min to break doom-scroll loops

G) Community — per-task discussion threads

* Each of the 30 tasks has its own discussion thread
* Threads are gated: only visible once the user has unlocked that task (no spoilers) — enforced by RLS policy on community_posts
* Users can post text entries (wins, challenges, tips)
* Reactions: fixed emoji set below each post: 👎 👍 🔥 ❤️ 😮. Rendered via `ReactionPill` component (not `PrimaryButton`) — smaller pill shape, `EmojiText` for proper emoji rendering, active state tracks the current user's reaction (not just count > 0).
* Replies: threaded below each post
* Basic moderation: report button rendered as ghost/muted text (gray-400, not a primary CTA), admin can hide/delete posts from CMS
* Author display: first name in natural case (not uppercased), day number (e.g., "Sarah — Day 12")
* Optional: use Supabase Realtime for live updates on threads

H) Home screen widget — V2 (not in V1)

* Deferred to V2. Native iOS (WidgetKit) + Android (Glance) widget.
* Keep architecture extensible for this — `get-journey-state` already returns all needed data.

I) Progress + stats

* In-app: **Journey map** — a winding serpentine path (not a flat checklist). Nodes alternate left/right in a zig-zag pattern connected by curved SVG lines (solid for completed, dashed for locked).
    * Completed nodes: filled green circles with a subtle idle jiggle animation (2° rotation oscillation)
    * Active node: larger (36px), pulsing green border, "START" badge below
    * Locked nodes: dashed empty circles (no lock icon — locked should feel like "not yet", not "forbidden")
    * Unlocked task nodes show a small interaction-type hint icon (Clock, Wind, Pen, etc.) for completed/active tasks only (preserves mystery for locked)
    * Day-unlock reveal: when a new task unlocks, node scales in with `SPRING_SNAPPY` + haptic `impactMedium`
    * Auto-scrolls to the active node on render
* Streak counter: **always visible** (never hidden at 0). At count 0: dimmed grey flame with "0" (mild loss-aversion — the flame is "out" but can be relit). At count > 0: green pill with animated counter increment (scale pulse + flame wobble on increase). Supports `size="sm"` and `size="lg"` props.
* "Your journey" timeline: scrollable history of completed tasks with check-in data
* **"Done for today" state** (after completing today's check-in, before next day unlocks):
    * "Your next task unlocks tomorrow" card + "Keep the momentum — Open community" card (already implemented)
    * Progress ring: animated SVG circle showing N/30 completion
    * Rotating motivational quote (deterministic per local date, changes daily)
    * Spaced-reinforcement review card surfaces here (using EmojiRating, not number buttons)
    * Heading adapts to streak: "Done for today" / "Building momentum" (3+) / "On fire" (7+)
* Web dashboard: richer stats view — completion rate, average ratings, time per task, reinforcement history

J) Admin CMS (web dashboard)

* Auth-gated admin panel (RLS checks `profiles.role = 'admin'`)
* Create / edit / reorder the 30 tasks (direct CRUD on `tasks` table)
* Each task has: title, task body (markdown), explanation body (markdown), deeper reading (markdown), multi-day flag, difficulty rating, tags, **interaction type** (dropdown: markdown / drag_list / timed_challenge / breathing_exercise / reflection_prompts / journal / community_prompt), **interaction config** (JSON editor for type-specific parameters)
* Preview task as it would appear on mobile
* Task list shows interaction type badges and warns if two consecutive tasks share the same type (breaks novelty)
* Manage notification templates (push + email) via `notification_templates` table
* View community posts + moderate (hide/delete) via `community_posts.is_hidden`
* View aggregate user analytics (active users, drop-off points, completion rates, popular discussion threads) via `admin-analytics` Edge Function
* Manage reward bundle content (links, files via Supabase Storage)
* Tune spaced-repetition parameters via `spaced_repetition_config` table

K) Payment + freemium gate

* First 15 tasks: fully free, no payment info collected
* Task 16: paywall screen layout (top to bottom):
    1. User's `motivating_answer` from onboarding (personalized hook: "You said you wanted to: [answer]")
    2. "You've completed 15 days. The next 15 unlock:" followed by 3 bullet points (deeper strategies, community access for all tasks, reward bundle)
    3. Price display: "£8 one time — not a subscription" (price from RevenueCat offering; ~$10 USD equivalent)
    4. Purchase button (primary CTA, `green-500`, full width)
    5. "Maybe later" ghost text link below (dismisses paywall, user stays on Day 15)
* Flat one-time purchase (not subscription) via RevenueCat SDK (`react-native-purchases`). Requires Expo Development Build (not Expo Go).
* Dev mode bypass: when `REVENUECAT_PUBLIC_SDK_KEY` is missing, show a "Dev mode: tap to unlock" button that sets payment_status directly.
* RevenueCat handles StoreKit + Google Play Billing, receipt validation, and entitlement management
* `verify-payment` Edge Function receives RevenueCat webhook and updates `profiles.payment_status`
* Web dashboard access is free for all users (view-only stats + community)
* Admin CMS is owner-only (separate auth role)

L) Post-completion phase

* Completion screen after task 30: congratulations with `motivating_answer` resurfaced, stats summary, options. Shows once as a modal, then the Journey tab returns to the full journey list.
* **Post-completion app state**: Journey tab shows all 30 completed tasks. Community threads remain accessible. Spaced repetition continues — reinforcement review cards and notifications keep appearing based on the algorithm. This keeps the user engaged long-term.
* **Resources page**: Accessible from Account tab post-completion. Links to curated digital resources. Seed with 4 placeholder items:
    * "ADHD Focus Toolkit" (Notion template) — placeholder URL
    * "30-Day Cheatsheet" (PDF) — placeholder URL
    * "Top 10 ADHD Books" — placeholder URL
    * "Focus YouTube Channels" — placeholder URL
    Admin manages via CMS.
* Knowledge quiz: 15 questions drawn from `content/quiz-questions.json` (placeholder content). Multiple choice, 4 options, one correct. Select 15 random per attempt.
* Quiz result: score + recommendation ("Great retention!" or "Consider revisiting the areas you missed").
* **Restart journey**: Creates a new `journey_id`. Old progress, check-ins, and SR state are preserved under the old `journey_id`. Community thread access is NOT affected (once unlocked, stays unlocked).
* Post-completion notifications via `daily-notifications` Edge Function — sends SR-selected review reminders.

M) Markdown rendering

* Task bodies, explanations, and deeper reading are stored as markdown.
* Mobile: render with `react-native-markdown-display`.
* Web: render with `react-markdown`.
* Email notification body is HTML (stored in `notification_templates.body`). Push notification body is plain text. The Edge Function renders differently based on channel.

N) Quality and engineering

* Strong TypeScript types: auto-generated from Postgres schema via `supabase gen types typescript`, plus app-level types in `packages/shared/src/types/`
* Unit tests for: spaced-repetition algorithm, journey progression logic (including journey restart with journey_id), check-in validation (timezone-aware), notification scheduling, paywall gating
* Integration tests for: auth flow (including email confirmation), task unlock sequence, payment verification, journey restart
* Accessibility: minimum AA contrast, VoiceOver/TalkBack support, reduced motion preference
* Performance: app launch to current task visible in < 2 seconds, animations at 60fps, offline-capable for current task view
* **Error handling**: Global error boundary (never blank screens), user-friendly toast messages for network errors, TanStack Query error/retry states. Never show raw errors or stack traces.
* **Security**: All tables use RLS — each user can only see their own data. Never log PII (emails, passwords, payment info). Service role key never exposed to clients. Community posts sanitized for XSS.
* **CORS**: All Edge Functions return CORS headers for web dashboard access.

O) Account screen

* Theme preference: **segmented control** (Light / Dark / System) — not three full-width buttons. Sliding indicator animation with `SPRING_QUICK`. Haptic `selectionChanged` on change.
* Notification channels: native `Switch` toggles for push/email (not buttons with checkmark prefixes).
* Sign-out button: visible, functional.
* Delete account: muted text link at the bottom of the screen (App Store requirement). Shows confirmation `Alert` before proceeding.
* Dark mode card borders: `AppCard` uses `dark:border-[#3A7D5C]` for better contrast (brighter than the default `dark-border` token).

P) Timezone handling

* All time-sensitive operations use the user's device timezone (stored in `profiles.notification_preferences.timezone`).
* Calendar day: 00:00 to 23:59 in user's timezone. Check-in at 23:59 = same day. 00:00 = next day.
* Time-gating, streak calculation, notification quiet hours all use this rule.
* Offline check-ins record client-side timestamp; server uses it for time-gate calculations.

Q) Interactive task types

* Each task in the DB has `interaction_type` (enum) and `interaction_config` (JSONB) columns. Default: `interaction_type = 'markdown'`, `interaction_config = '{}'`.
* The mobile app's `TaskRenderer` component switches on `interaction_type` to render the right interactive experience:
    * **markdown** (default): renders `MarkdownBlock` with `task_body`. Calls `onComplete()` on mount (no gate).
    * **drag_list**: user builds a reorderable list (e.g., "Build your rotation list"). Config: `{ minItems, maxItems, placeholder, instruction }`. Gate: items.length >= minItems.
    * **timed_challenge**: countdown timer with optional breathing cadence overlay. Config: `{ durationSeconds, label, breathingCadence? }`. Gate: timer reaches 0.
    * **breathing_exercise**: pulsing circle visual guide (inhale/hold/exhale). Config: `{ durationSeconds, inhaleSeconds, holdSeconds, exhaleSeconds, label }`. Gate: all cycles complete.
    * **reflection_prompts**: 2–4 questions shown one at a time with slide transitions. Config: `{ prompts: string[] }`. Gate: all prompts answered (min 10 chars each).
    * **journal**: prompted writing with character counter. Config: `{ prompt, minCharacters }`. Gate: text.length >= minCharacters.
    * **community_prompt**: shows prompt + "Open community" button. Config: `{ prompt, navigateTo }`. Gate: immediate (honor system via check-in).
* No two consecutive days should share the same `interaction_type` (novelty principle). Target distribution across 30 tasks: ~8 markdown, ~6 timed, ~6 reflection, ~5 journal, ~3 drag_list, ~2 community_prompt.
* `onComplete(data?)` passes interaction output (list items, journal text, answers) into the check-in as `promptResponses.interaction_data`.

R) Micro-feedback + haptics

* Every meaningful interaction fires a haptic via `useHaptics` hook. Key additions beyond what's already implemented:
    * Community: `successNotification` on post submit, `selectionChanged` on reaction toggle, `impactLight` on reply submit
    * Journey map: `impactLight` on node tap, `impactMedium` on day unlock
    * Streak: `successNotification` on increment
    * Account: `selectionChanged` on theme/notification toggles
    * Pull-to-refresh: `impactLight` on complete
    * Interactive tasks: `selectionChanged` on drag-list add/reorder, `impactLight` on delete, `successNotification` on timer/breathing complete, `selectionChanged` on reflection "Next", `successNotification` on journal threshold crossed
* All animations use spring physics from `animations/springs.ts` — never linear/ease. Respect `useReducedMotion` (currently stubbed to `false` for dev — **must restore before release**).

S) Journey restart + journey_id

* `journey_id` column on `tasks`, `user_progress`, `check_ins`, `spaced_repetition_state`.
* Default UUID for V1's single journey. When user restarts, a new UUID is generated.
* Old data preserved under old `journey_id`. Community thread access persists across all journeys.
* `profiles.current_journey_id` tracks the active journey.

T) Known temporary regressions (must fix before release)

* `useReducedMotion` hook hardcoded to `{ reducedMotion: false }` — must restore `AccessibilityInfo` listener + `useProfilePreferences` integration.
* Auth email confirmation bypassed in `RegisterScreen.tsx`, `RegisterForm.tsx`, and `supabase/config.toml` (`enable_confirmations = false`) — must revert all three.

Process requirements (follow strictly)

1. PLANNING FIRST (update `plans.md` before coding anything):

    * `plans.md` must have a milestone plan (at least 16 milestones).
    * For each milestone include: scope, key files/modules, acceptance criteria, and commands to verify.
    * Include a "risk register" with top technical risks and mitigation plans.
    * Include a "retention strategy" section explaining every mechanism that keeps ADHD users engaged.
    * Include an "architecture overview" section (or reference `architecture.md`).

2. SCAFFOLD SECOND:

    * Initialize the Turborepo monorepo with Expo mobile app + Next.js web dashboard + shared package.
    * Initialize Supabase project (`supabase init`), write initial migration, seed data.
    * Add lint/typecheck/test tooling.
    * Generate TypeScript types from schema.
    * Ensure the app shows the shell UI (onboarding → current task → locked tasks).

3. IMPLEMENT THIRD:

    * Implement one milestone at a time.
    * After each milestone: run `npx turbo lint && npx turbo typecheck && npx turbo test`, fix issues, commit with a clear message.
    * Keep diffs reviewable and avoid giant unstructured changes.

4. UX polish throughout:

    * All animations use spring physics via react-native-reanimated `withSpring` — never linear/ease. See `design.md` for exact spring configs (`default`, `snappy`, `gentle`, `quick`) and signature motion specs.
    * ADHD-optimized: task is always the first thing visible. No walls of text before the action.
    * Empty states, toasts (bottom-positioned, 60px above tab bar), haptic feedback on key actions (see `design.md` haptics table).
    * Onboarding flow that captures the user in < 60 seconds (name, one motivating question: "What's the one thing you'd do if you could actually focus?", straight to Day 1).

5. If you hit complexity choices:

    * Prefer user retention impact over engineering elegance.
    * Document tradeoffs and decisions in `plans.md` as you go.

6. Credentials and external services:

    * For initial development, use `supabase start` (local Supabase stack) — no cloud credentials needed.
    * Stub external service calls (FCM, Resend, RevenueCat) with console.log in dev mode. Use environment variable checks: if the key is missing, log a warning and skip the external call.
    * RevenueCat (`react-native-purchases`) requires Expo Development Build. Dev mode bypass available when SDK key is missing.
    * Mark milestones that require real credentials with a `[NEEDS CREDENTIALS]` tag. The human operator will provide these before those milestones can be fully tested.
    * Never hardcode API keys. Always read from environment variables.
    * Edge Functions use `supabase functions serve --env-file .env.local` for local dev.

Start now.
First, read `plans.md`. If it needs updating to match this spec and the architecture in `architecture.md`, update it. Then begin Milestone 1. The repo is empty — no package.json exists yet. Do NOT start coding until `plans.md` is coherent and aligned with `architecture.md`.
