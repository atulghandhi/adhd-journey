You are acting as a senior staff engineer and tech lead. Build FocusLab — a mobile-first ADHD journey app that guides users through a 30-task sequential program designed to build lasting focus habits.

Core goals

* User retention is the #1 priority. ADHD users lose interest in apps quickly. Every design and engineering decision must serve engagement and stickiness.
* The app must feel alive — slick, bouncy animations that are fast enough to not bore an ADHD brain but polished enough to feel premium.
* This is not a journaling app, not a quote-of-the-day app. It is an active, structured behavioral program with spaced reinforcement, gated progression, and community accountability.
* You will plan first, then implement milestone by milestone. Do not skip the planning phase.

Hard requirements

* Platforms: iOS + Android native apps (primary), responsive web dashboard (secondary — admin CMS + user stats/history).
* Auth + cloud sync from day 1. Users must be able to switch devices seamlessly.
* Freemium model: first 15 tasks free (no payment info required), tasks 16–30 require a flat one-time purchase.
* Push notifications + email for V1 with varied templates/copy to exploit ADHD novelty-seeking.
* Home screen widget (iOS + Android) showing journey progress.
* Admin CMS for the owner to create, edit, and reorder task content without code changes.
* Every milestone must include verification steps (tests, lint, typecheck).
* Tech stack TBD — keep architecture decisions in `plans.md` so we can finalize before coding.

Deliverable
A repo that contains:

* Working mobile apps (iOS + Android) implementing the features below
* A responsive web dashboard (admin CMS + user-facing stats)
* Backend API + database supporting auth, cloud sync, content management, notifications, community, and analytics
* Architecture docs explaining the data model, API design, spaced-repetition algorithm, and notification engine
* Scripts: dev, build, test, lint, typecheck
* A `plans.md` file capturing the full implementation plan and ongoing notes

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

* Required to unlock: one quick check-in (emoji scale or 1–5 rating + "did you try it?" toggle). Must take < 10 seconds.
* Optional depth: 2–3 structured prompts (what happened, what was hard, what surprised you) with short text fields
* Deeper reflections are stored and visible in the user's history on the web dashboard
* The spaced-repetition algorithm uses check-in data (rating, completion signal, time spent) to adjust reinforcement timing

C) Spaced-repetition engine

* Algorithm-driven (inspired by SM-2 / Anki) resurfacing of past tasks
* Inputs: check-in rating, days since task, number of reviews, user-reported difficulty
* Outputs: which past task to resurface and when, whether current task should extend to multi-day
* Reinforcement appears as a lightweight "review card" — not a full redo, but a quick reminder + mini check-in
* Must be tunable: admin can set base intervals, difficulty multipliers, and max review frequency

D) Notification engine — novelty-driven engagement

* Push notifications with rotating templates/copy (different tone, different emoji, different framing each day)
* Email digests with varied headers and layouts (not the same template every time)
* One notification channel per day (not all at once — push today, email tomorrow, etc.)
* Notification content is context-aware: references the user's current task, days active, streak
* Quiet hours respect + user-configurable notification preferences
* V2 roadmap: SMS, richer novelty (different notification sounds, widget animations)

E) Mindful gateway (V1: guided setup)

* V1: in-app tutorial that walks users through setting up iOS Shortcuts / Android automation to add a 5-second breathing pause before opening "brain rot" apps (YouTube, TikTok, Instagram, games)
* Tutorial includes step-by-step screenshots, deep links where possible, and a "test it now" verification step
* V2 roadmap: native app-intercept with breathing overlay + timed check-ins at 10min/30min to break doom-scroll loops

F) Community — per-task discussion threads

* Each of the 30 tasks has its own discussion thread
* Threads are gated: only visible once the user has unlocked that task (no spoilers)
* Users can post text entries (wins, challenges, tips)
* Other users can react (emoji reactions) and reply
* Basic moderation: report button, admin can hide/delete posts from CMS
* Author display: first name + day number (e.g., "Sarah — Day 12")

G) Home screen widget

* Native iOS widget (WidgetKit) and Android widget (Glance / AppWidgets)
* Shows: current day / 30, streak count, today's task title (truncated)
* Tapping the widget opens the app to the current task
* Visual progress bar or ring
* Updates daily when a new task unlocks

H) Progress + stats

* In-app: visual journey map or progress bar showing completed / current / locked tasks
* Streak counter (consecutive days with a check-in)
* "Your journey" timeline: scrollable history of completed tasks with check-in data
* Web dashboard: richer stats view — completion rate, average ratings, time per task, reinforcement history

I) Admin CMS (web dashboard)

* Auth-gated admin panel (separate from user dashboard)
* Create / edit / reorder the 30 tasks
* Each task has: title, task body (markdown), explanation body (markdown), deeper reading (markdown), multi-day flag, difficulty rating, tags
* Preview task as it would appear on mobile
* Manage notification templates (push + email)
* View community posts + moderate (hide/delete)
* View aggregate user analytics (active users, drop-off points, completion rates, popular discussion threads)
* Manage reward bundle content (links, files)

J) Payment + freemium gate

* First 15 tasks: fully free, no payment info collected
* Task 16: paywall screen with value proposition, testimonials placeholder, and purchase button
* Flat one-time purchase (not subscription) via App Store / Google Play in-app purchase
* Web dashboard access is free for all users (view-only stats + community)
* Admin CMS is owner-only (separate auth role)

K) Quality and engineering

* Strong TypeScript types for: task model, user progress, check-in data, spaced-repetition state, notification payloads, community posts, API contracts
* Unit tests for: spaced-repetition algorithm, journey progression logic, check-in validation, notification scheduling, paywall gating
* Integration tests for: auth flow, task unlock sequence, payment verification
* Accessibility: minimum AA contrast, VoiceOver/TalkBack support, reduced motion preference
* Performance: app launch to current task visible in < 2 seconds, animations at 60fps, offline-capable for current task view

Process requirements (follow strictly)

1. PLANNING FIRST (write this file before coding anything):

    * Create `plans.md` with a milestone plan (at least 16 milestones).
    * For each milestone include: scope, key files/modules, acceptance criteria, and commands to verify.
    * Include a "risk register" with top technical risks and mitigation plans (user retention, spaced-repetition tuning, notification deliverability, cross-platform widget, payment integration, community moderation).
    * Include a "retention strategy" section explaining every mechanism that keeps ADHD users engaged.
    * Include an "architecture overview" section describing:
        * data model (users, tasks, progress, check-ins, community)
        * API design (REST or GraphQL, auth, rate limiting)
        * spaced-repetition algorithm (inputs, outputs, tuning knobs)
        * notification engine (scheduling, template rotation, channel selection)
        * payment flow (IAP verification, entitlement checking)
        * offline strategy (what works without internet)
        * widget architecture (data flow from backend to widget)

2. SCAFFOLD SECOND:

    * Initialize the repo with the chosen mobile framework + web dashboard framework.
    * Add lint/typecheck/test tooling.
    * Set up backend project structure (API, database, auth).
    * Ensure the app shows the shell UI (onboarding → current task → locked tasks).

3. IMPLEMENT THIRD:

    * Implement one milestone at a time.
    * After each milestone: run verification commands, fix issues, commit with a clear message.
    * Keep diffs reviewable and avoid giant unstructured changes.

4. UX polish throughout:

    * Bouncy, quick animations (spring physics, not linear easing). Fast enough to not feel sluggish, polished enough to feel premium.
    * ADHD-optimized: task is always the first thing visible. No walls of text before the action.
    * Empty states, toasts, haptic feedback on key actions.
    * Onboarding flow that captures the user in < 60 seconds (name, one motivating question, straight to Day 1).

5. If you hit complexity choices:

    * Prefer user retention impact over engineering elegance.
    * Document tradeoffs and decisions in `plans.md` as you go.

Start now.
First, create `plans.md` with the complete plan, risk register, retention strategy, and architecture overview. Do NOT start coding until `plans.md` exists and is coherent.
