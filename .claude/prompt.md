You are acting as a senior staff engineer and tech lead. Build FocusLab — a mobile-first ADHD journey app that guides users through a 30-task sequential program designed to build lasting focus habits.

Core goals

* User retention is the #1 priority. ADHD users lose interest in apps quickly. Every design and engineering decision must serve engagement and stickiness.
* The app must feel alive — spring-based animations (see `design.md` for exact `withSpring` configs) that are fast enough to not bore an ADHD brain but polished enough to feel premium.
* This is not a journaling app, not a quote-of-the-day app. It is an active, structured behavioral program with spaced reinforcement, gated progression, and community accountability.
* You will plan first, then implement milestone by milestone. Do not skip the planning phase.

Hard requirements

* Platforms: iOS + Android via React Native + Expo (primary), Next.js web dashboard (secondary — admin CMS + user stats/history).
* Auth + cloud sync from day 1 via Supabase Auth. Users must be able to switch devices seamlessly.
* Freemium model: first 15 tasks free (no payment info required), tasks 16–30 require a flat one-time purchase via RevenueCat.
* Push notifications (FCM via expo-notifications) + email (Resend) for V1 with varied templates/copy to exploit ADHD novelty-seeking.
* Home screen widget (iOS + Android) showing journey progress.
* Admin CMS for the owner to create, edit, and reorder task content without code changes.
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
    * The task itself — immediately visible, above the fold, no scrolling required
    * Below the fold: explanation of why this task matters (the science/reasoning)
    * Below that: optional deeper reading / related concepts
* Gated progression: user must complete a reflection check-in to unlock the next task
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
* Scheduling via `daily-notifications` Edge Function triggered by pg_cron
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
* Reactions: fixed emoji set below each post: 👎 👍 🔥 ❤️ 😮. Tap to toggle. Active reaction shows count in a `green-100` pill.
* Replies: threaded below each post
* Basic moderation: report button, admin can hide/delete posts from CMS
* Author display: first name + day number (e.g., "Sarah — Day 12")
* Optional: use Supabase Realtime for live updates on threads

H) Home screen widget

* Native iOS widget (WidgetKit) and Android widget (Glance / AppWidgets)
* Shows: current day / 30, streak count, today's task title (truncated)
* Tapping the widget opens the app to the current task
* Visual progress bar or ring
* Data flow: `get-journey-state` Edge Function → app caches to shared storage → widget reads from shared storage
* Updates daily when a new task unlocks

I) Progress + stats

* In-app: visual journey map or progress bar showing completed / current / locked tasks
* Streak counter (consecutive days with a check-in)
* "Your journey" timeline: scrollable history of completed tasks with check-in data
* Web dashboard: richer stats view — completion rate, average ratings, time per task, reinforcement history

J) Admin CMS (web dashboard)

* Auth-gated admin panel (RLS checks `profiles.role = 'admin'`)
* Create / edit / reorder the 30 tasks (direct CRUD on `tasks` table)
* Each task has: title, task body (markdown), explanation body (markdown), deeper reading (markdown), multi-day flag, difficulty rating, tags
* Preview task as it would appear on mobile
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
    3. Price display: "$X.XX one time — not a subscription" (price from RevenueCat offering)
    4. Purchase button (primary CTA, `green-500`, full width)
    5. "Maybe later" ghost text link below (dismisses paywall, user stays on Day 15)
* Flat one-time purchase (not subscription) via RevenueCat SDK (`react-native-purchases`)
* RevenueCat handles StoreKit + Google Play Billing, receipt validation, and entitlement management
* `verify-payment` Edge Function receives RevenueCat webhook and updates `profiles.payment_status`
* Web dashboard access is free for all users (view-only stats + community)
* Admin CMS is owner-only (separate auth role)

L) Post-completion phase

* Completion screen after task 30: congratulations, stats summary, options.
* Knowledge quiz: 15 questions, one per task (drawn from task content). Multiple choice, 4 options, one correct. Select 15 random questions per attempt. Store questions in a `quiz_questions` table or JSON in `content/`.
* Quiz result: score + recommendation ("Great retention!" or "Consider restarting the areas you missed").
* Reward bundle screen: links to digital resources. For V1 use placeholder links — admin manages via CMS. Seed with 4 items:
    * "ADHD Focus Toolkit" (Notion template) — placeholder URL
    * "30-Day Cheatsheet" (PDF) — placeholder URL
    * "Top 10 ADHD Books" — placeholder URL
    * "Focus YouTube Channels" — placeholder URL
* "Restart journey" option: resets user_progress and spaced_repetition_state.
* Post-completion random task reminders via `daily-notifications` Edge Function.

M) Markdown rendering

* Task bodies, explanations, and deeper reading are stored as markdown.
* Mobile: render with `react-native-markdown-display`.
* Web: render with `react-markdown`.
* Email notification body is HTML (stored in `notification_templates.body`). Push notification body is plain text. The Edge Function renders differently based on channel.

N) Quality and engineering

* Strong TypeScript types: auto-generated from Postgres schema via `supabase gen types typescript`, plus app-level types in `packages/shared/src/types/`
* Unit tests for: spaced-repetition algorithm, journey progression logic, check-in validation, notification scheduling, paywall gating
* Integration tests for: auth flow, task unlock sequence, payment verification
* Accessibility: minimum AA contrast, VoiceOver/TalkBack support, reduced motion preference
* Performance: app launch to current task visible in < 2 seconds, animations at 60fps, offline-capable for current task view

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
    * Mark milestones that require real credentials with a `[NEEDS CREDENTIALS]` tag. The human operator will provide these before those milestones can be fully tested.
    * Never hardcode API keys. Always read from environment variables.

Start now.
First, read `plans.md`. If it needs updating to match this spec and the architecture in `architecture.md`, update it. Then begin Milestone 1. Do NOT start coding until `plans.md` is coherent and aligned with `architecture.md`.
