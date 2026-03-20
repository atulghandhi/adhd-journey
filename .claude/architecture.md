# FocusLab Architecture

FocusLab is a mobile-first ADHD journey app with a cloud-synced backend and admin CMS. The architecture prioritizes offline resilience, low-friction interactions, and an algorithm-driven reinforcement engine that adapts to each user's progress.

## Guiding principles

- Retention over cleverness: every architectural choice serves user engagement.
- Offline-first mobile: the current task and recent check-ins work without internet.
- Content-driven: task content lives in the database, managed via admin CMS, not hardcoded.
- Algorithm-tunable: spaced-repetition parameters are configurable without code changes.
- Managed services first: use Supabase, FCM, Resend, and RevenueCat to minimize self-hosted infrastructure. No Docker, no Redis, no custom auth middleware.
- Clean code: maintainable, performant, easy to build upon. Prefer clarity over cleverness.

## Tech stack (locked — do not change without updating all .claude files)

| Layer | Technology | Why |
|---|---|---|
| Mobile | React Native + Expo (SDK 52+) | Cross-platform, fast iteration, Expo manages native builds |
| Web dashboard | Next.js 14+ (App Router) + Tailwind CSS | SSR for admin, fast dev, shared React knowledge |
| Backend / DB | Supabase (managed Postgres + Auth + Storage + Edge Functions + Realtime) | Zero infra management, built-in auth, auto-generated REST/GraphQL |
| ORM / query | Supabase JS client (`@supabase/supabase-js`) for client-side; raw SQL migrations for schema | No separate ORM — Supabase client handles typed queries via generated types |
| State (mobile) | Zustand + TanStack Query (React Query) | Zustand for local UI state, TanStack Query for server state / caching |
| State (web) | TanStack Query | Same caching layer as mobile |
| Push notifications | Firebase Cloud Messaging (FCM) via `expo-notifications` | Free, works on iOS + Android, Expo has first-class support |
| Email | Resend (`resend` npm package) | Simple API, generous free tier (100 emails/day), great DX |
| Payments / IAP | RevenueCat (`react-native-purchases`) | Handles StoreKit + Google Play Billing, receipt validation, entitlements — free under $2.5k/mo revenue |
| Testing | Vitest (shared + web), Jest + React Native Testing Library (mobile), Deno test (Edge Functions) |
| Monorepo | Turborepo | Caching, task orchestration, works well with Expo + Next.js |
| Styling (mobile) | NativeWind (Tailwind for RN) | Consistent with web Tailwind, utility-first |
| Linting | ESLint + Prettier | Standard, zero-warnings policy |
| Type generation | `supabase gen types typescript` | Auto-generates TS types from Postgres schema — single source of truth |
| Native builds | Expo Dev Builds via EAS (`expo-dev-client`) | Required for native modules (RevenueCat, push notifications). Expo Go used for UI-only iteration. |

## System overview

```
┌───────────────┐   ┌─────────────┐   ┌────────────────────┐
│  iOS App      │   │ Android App │   │  Web Dashboard     │
│  (Expo)       │   │  (Expo)     │   │  (Next.js)         │
└──────┬────────┘   └──────┬──────┘   └────────┬───────────┘
       │                   │                    │
       └───────────┬───────┘                    │
                   │          ┌─────────────────┘
                   ▼          ▼
          ┌────────────────────────────┐
          │        Supabase            │
          │  ┌──────────────────────┐  │
          │  │ Auth (email, OAuth)  │  │
          │  ├──────────────────────┤  │
          │  │ Postgres Database    │  │
          │  │ + pg_cron + pg_net   │  │
          │  ├──────────────────────┤  │
          │  │ Edge Functions       │  │
          │  │ (biz logic + jobs)   │  │
          │  ├──────────────────────┤  │
          │  │ Storage (files)      │  │
          │  ├──────────────────────┤  │
          │  │ Realtime (community) │  │
          │  └──────────────────────┘  │
          └─────────┬──────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │   FCM    │ │  Resend  │ │  RevenueCat  │
  │  (push)  │ │  (email) │ │  (payments)  │
  └──────────┘ └──────────┘ └──────────────┘
```

## Environment variables (required)

The agent must create a `.env.example` file in the repo root with these variables. The human operator fills in real values in `.env.local` (never committed).

```env
# Supabase — get from https://supabase.com/dashboard → Project Settings → API
# For local dev: printed by `supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Expo / Mobile — same Supabase values, prefixed for Expo
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Firebase Cloud Messaging — get from Firebase Console → Project Settings → Cloud Messaging
FCM_SERVER_KEY=AAAA...
# (iOS also needs APNs key uploaded to Firebase Console — manual step, documented in setup guide)

# Resend — get from https://resend.com/api-keys
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=focus@yourdomain.com

# RevenueCat — get from https://app.revenuecat.com → API Keys
REVENUECAT_PUBLIC_SDK_KEY=appl_...
REVENUECAT_SECRET_KEY=sk_...

# Admin bootstrap — the email used for the admin account
ADMIN_EMAIL=admin@focuslab.local

# Supabase Edge Functions use these via `supabase secrets set` (production)
# or via `supabase functions serve --env-file .env.local` (local dev):
# FCM_SERVER_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, REVENUECAT_SECRET_KEY
```

### Credential setup checklist (human must do before agent can test)

1. **Supabase project** — Create at supabase.com. Copy URL + anon key + service role key.
2. **Firebase project** — Create at console.firebase.google.com. Enable Cloud Messaging. Copy server key. Upload APNs key for iOS.
3. **Resend account** — Sign up at resend.com. Create API key. Verify sender domain (or use onboarding@resend.dev for testing).
4. **RevenueCat account** — Sign up at revenuecat.com. Create app entries for iOS + Android. Copy public SDK key. Configure a single non-renewing purchase product at £8 / ~$10 USD.
5. **Apple Developer account** — Required for iOS builds, push certs, and App Store IAP. Not needed for Expo Go testing.
6. **Google Play Console** — Required for Android production IAP. Not needed for dev.

### What the agent CAN test without credentials

- All Supabase operations work locally with `supabase start` (local dev stack — no cloud account needed).
- Spaced-repetition algorithm is pure logic — no external deps.
- UI components and navigation — Expo Go for UI iteration, no credentials needed.
- Web dashboard — runs against local Supabase.
- Edge Functions — testable locally with `supabase functions serve --env-file .env.local`.
- Payment flow — dev mode bypass when `REVENUECAT_PUBLIC_SDK_KEY` is missing.

## Timezone handling (critical — applies everywhere)

All time-sensitive operations use the user's device timezone, stored in `profiles.notification_preferences.timezone` (IANA format, e.g., `"Europe/London"`, `"America/New_York"`).

### Rules
- A calendar day runs from **00:00:00** to **23:59:59** in the user's timezone.
- Check-in at **23:59** = same day. Check-in at **00:00** = next day.
- **Time-gating**: next task unlocks no earlier than the start of the next calendar day in the user's timezone.
- **Streak**: consecutive calendar days (user's timezone) with at least one `check_ins` row. A day with zero check-ins breaks the streak.
- **Notification quiet hours**: default 21:00–08:00 in user's timezone.
- **Offline check-ins**: the client records the timestamp at the moment the user taps submit. This timestamp is sent to the server and used for time-gate calculations — not the server receive time.

### Implementation
- Edge Functions convert UTC timestamps to user's timezone using `Intl.DateTimeFormat` or a lightweight library.
- `complete-check-in` accepts an optional `checked_in_at` field (ISO 8601). If provided (offline replay), it uses that timestamp for time-gate logic. If absent, it uses `now()`.
- `get-journey-state` computes streak and next-unlock time in the user's timezone.

## Data model

All tables live in Supabase Postgres. Schema is managed via SQL migration files in `supabase/migrations/`. Types are auto-generated with `supabase gen types typescript`.

### Constants
- **DEFAULT_JOURNEY_ID**: A hardcoded UUID constant (e.g., `'00000000-0000-0000-0000-000000000001'`) used as the default `journey_id` for all V1 data. When a user restarts, a new UUID is generated for the new journey.

### profiles (extends Supabase auth.users)
- `id` (uuid, FK → auth.users.id, primary key)
- `name` (text)
- `avatar_url` (text, nullable)
- `role` (text, default 'user' — values: 'user', 'admin')
- `payment_status` (text, default 'free' — values: 'free', 'paid')
- `payment_receipt` (jsonb, nullable)
- `notification_preferences` (jsonb — `{ channels: ["push", "email"], quiet_start: "21:00", quiet_end: "08:00", timezone: "Europe/London" }`)
- `onboarding_complete` (boolean, default false)
- `motivating_answer` (text, nullable — from onboarding, max 200 chars)
- `theme_preference` (text, default 'light' — values: 'light', 'dark', 'system')
- `current_journey_id` (uuid, default DEFAULT_JOURNEY_ID — tracks which journey the user is currently on)
- `created_at`, `last_active_at`

Note: Supabase Auth handles email, password hash, OAuth providers, JWT tokens, and refresh tokens automatically. The `profiles` table stores app-specific data, linked by `id` to `auth.users.id`. A database trigger auto-creates a profile row on signup (using `NEW.raw_user_meta_data->>'name'` for the name field).

### tasks (admin-authored content)
- `id` (uuid, primary key)
- `journey_id` (uuid, default DEFAULT_JOURNEY_ID — future-proofs for multiple journey types)
- `order` (integer, 1–30, unique per journey_id)
- `title` (text)
- `task_body` (text — markdown, the immediate action)
- `explanation_body` (text — markdown, the why; use placeholder text until human content is ready)
- `deeper_reading` (text, nullable — markdown, optional)
- `difficulty_rating` (integer, 1–5, used by spaced-repetition)
- `default_duration_days` (integer, default 1 — 2–3 for complex tasks)
- `tags` (text[] — for categorization and search)
- `interaction_type` (enum: `'markdown'` | `'drag_list'` | `'timed_challenge'` | `'breathing_exercise'` | `'reflection_prompts'` | `'journal'` | `'community_prompt'`, default `'markdown'` — determines which interactive renderer the mobile app uses for this task)
- `interaction_config` (jsonb, default `'{}'` — type-specific configuration; schema varies per `interaction_type`, see `.claude/change-phase2.md` for config schemas per type)
- `is_active` (boolean, default true — admin can draft/unpublish)
- `created_at`, `updated_at`

Note: No two consecutive tasks (by `order`) should share the same `interaction_type` — this preserves novelty for ADHD engagement. The admin CMS warns when this rule is violated.

### user_progress
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `journey_id` (uuid — which journey instance this progress belongs to)
- `status` (text — 'locked', 'active', 'in_review', 'completed')
- `unlocked_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)
- `current_day` (integer, default 1 — for multi-day tasks, displayed as "Day X (1 of N)")
- `extended_days` (integer, default 0 — how many extra days the algorithm added)
- `extended_by_algorithm` (boolean, default false)
- Unique constraint on `(user_id, task_id, journey_id)`

### check_ins
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `journey_id` (uuid — which journey instance)
- `type` (text — 'completion', 'reinforcement_review')
- `quick_rating` (integer, 1–5)
- `tried_it` (boolean)
- `prompt_responses` (jsonb, nullable — `{ what_happened: "", what_was_hard: "", what_surprised: "", interaction_data?: any }` — `interaction_data` holds output from interactive task renderers: drag-list items, journal text, reflection answers, etc.)
- `time_spent_seconds` (integer)
- `checked_in_at` (timestamptz — client-provided timestamp for offline support; defaults to `now()`)
- `created_at` (timestamptz — server timestamp, always `now()`)

### spaced_repetition_state
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `journey_id` (uuid — which journey instance)
- `ease_factor` (real, default 2.5)
- `interval_days` (real, default 1)
- `review_count` (integer, default 0)
- `next_review_date` (date)
- `last_review_rating` (integer, nullable)
- Unique constraint on `(user_id, task_id, journey_id)`

### community_posts
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `body` (text)
- `is_hidden` (boolean, default false — admin moderation)
- `created_at` (timestamptz)

### community_reactions
- `id` (uuid, primary key)
- `post_id` (uuid, FK → community_posts.id)
- `user_id` (uuid, FK → profiles.id)
- `emoji` (text)
- Unique constraint on `(post_id, user_id, emoji)`

### community_replies
- `id` (uuid, primary key)
- `post_id` (uuid, FK → community_posts.id)
- `user_id` (uuid, FK → profiles.id)
- `body` (text)
- `is_hidden` (boolean, default false)
- `created_at` (timestamptz)

### community_reports
- `id` (uuid, primary key)
- `post_id` (uuid, FK → community_posts.id)
- `reporter_user_id` (uuid, FK → profiles.id)
- `reason` (text)
- `created_at` (timestamptz)

### notification_log
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `channel` (text — 'push', 'email')
- `template_id` (uuid, FK → notification_templates.id)
- `sent_at` (timestamptz)
- `opened_at` (timestamptz, nullable)

### notification_templates
- `id` (uuid, primary key)
- `channel` (text — 'push', 'email')
- `subject` (text — used as push title or email subject)
- `body` (text — supports `{{task_title}}`, `{{streak}}`, `{{day_number}}`, `{{user_name}}`)
- `tone_tag` (text — 'encouraging', 'playful', 'direct', 'reflective')
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### spaced_repetition_config (single-row table for admin-tunable params)
- `id` (integer, default 1, primary key — always one row)
- `base_interval_days` (real, default 1)
- `ease_floor` (real, default 1.3)
- `struggle_threshold` (integer, default 2)
- `max_reviews_per_day` (integer, default 1)
- `decay_multiplier` (real, default 0.5)
- `updated_at` (timestamptz)

### push_tokens
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `token` (text)
- `platform` (text — 'ios', 'android')
- `created_at` (timestamptz)
- Unique constraint on `(user_id, token)`

### quiz_questions
- `id` (uuid, primary key)
- `task_id` (uuid, FK → tasks.id)
- `question` (text)
- `options` (jsonb — `["Option A", "Option B", "Option C", "Option D"]`)
- `correct_index` (integer, 0–3)
- `created_at` (timestamptz)

## Row Level Security (RLS) policies

All tables have RLS enabled. Policies:

- **profiles**: Users can read/update their own row. Admins can read all.
- **tasks**: Anyone authenticated can read active tasks. Only admins can insert/update/delete.
- **user_progress**: Users can read/insert/update their own rows (any journey_id). Admins can read all.
- **check_ins**: Users can read/insert their own rows. Admins can read all.
- **spaced_repetition_state**: Users can read/update their own rows. Service role (Edge Functions) can update any.
- **community_posts**: Users can read posts for tasks they've **ever** unlocked in **any** journey — `EXISTS (SELECT 1 FROM user_progress WHERE user_id = auth.uid() AND task_id = community_posts.task_id AND status != 'locked')`. This ensures thread access persists after journey restart. Users can insert their own posts for unlocked tasks. Admins can update `is_hidden`.
- **community_reactions / community_replies**: Same gating as community_posts for reads. Users can insert/delete their own.
- **community_reports**: Users can insert reports for any visible post. Admins can read all.
- **notification_log**: Users can read their own. Service role can insert.
- **notification_templates**: Anyone authenticated can read active templates. Admins can CRUD.
- **spaced_repetition_config**: Anyone authenticated can read. Admins can update.
- **push_tokens**: Users can read/insert/delete their own. Service role can read all.
- **quiz_questions**: Anyone authenticated can read. Admins can CRUD.

### RLS performance note
The community_posts `EXISTS` subquery runs on every row read. This is fine for V1 (up to ~100 users). When approaching 1k+ users, add a composite index: `CREATE INDEX idx_user_progress_community ON user_progress(user_id, task_id, status);` — migration-only change, zero app code impact, zero data loss.

## API design

Supabase provides an auto-generated REST API (PostgREST) for all tables. For simple CRUD (read tasks, insert check-ins, update profiles), use the Supabase JS client directly — no custom API code needed.

Custom business logic lives in **Supabase Edge Functions** (Deno runtime, deployed with `supabase functions deploy`):

### Edge Functions (custom logic only)

- `complete-check-in` — Validates check-in, updates user_progress, triggers spaced-repetition recalculation, enforces time-gating (using `checked_in_at` timestamp in user's timezone). Called instead of raw insert to `check_ins` table.
- `get-journey-state` — Returns the user's full journey state: current task, streak (timezone-aware), reinforcement review (if any), progress map, journey metadata. Computes streak using `checked_in_at` grouped by calendar day in user's timezone.
- `daily-notifications` — Triggered by pg_cron → pg_net. Iterates users, selects channel + template, sends via FCM/Resend. Handles post-completion users too (sends SR reminders).
- `daily-reviews` — Triggered by pg_cron → pg_net. Computes which users need reinforcement reviews today, updates spaced_repetition_state.
- `verify-payment` — Receives RevenueCat webhook or client-side receipt, updates payment_status.
- `admin-analytics` — Aggregates user stats (drop-off points, completion rates, popular threads) for admin dashboard.

### CORS for Edge Functions

All Edge Functions must return proper CORS headers so the web dashboard (Next.js) can call them. Create a shared utility at `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
```

Every Edge Function should handle OPTIONS preflight and include these headers on all responses.

### pg_cron + pg_net for scheduled Edge Functions

pg_cron cannot invoke Edge Functions directly — it runs SQL only. Use the `pg_net` extension to make HTTP calls from within SQL:

```sql
-- Enable extensions (in migration)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily-notifications to run every hour
SELECT cron.schedule(
  'daily-notifications',
  '0 * * * *',  -- every hour, on the hour
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule daily-reviews to run once daily at 03:00 UTC
SELECT cron.schedule(
  'daily-reviews',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-reviews',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Note: `app.settings.supabase_url` and `app.settings.service_role_key` are set via `ALTER DATABASE` or Supabase dashboard config. For local dev, these come from `supabase start` output.

### Direct Supabase client calls (no Edge Function needed)

- Auth: `supabase.auth.signUp()`, `signInWithPassword()`, `signInWithOAuth()`, `getSession()`, `refreshSession()`
- Read tasks: `supabase.from('tasks').select('*').order('order')`
- Read progress: `supabase.from('user_progress').select('*').eq('user_id', userId).eq('journey_id', currentJourneyId)`
- Community CRUD: direct inserts/selects on `community_posts`, `community_reactions`, `community_replies` — RLS handles gating
- Profile updates: `supabase.from('profiles').update({...}).eq('id', userId)`
- Notification prefs: direct update on `profiles.notification_preferences`
- Push token registration: direct insert on `push_tokens`
- Admin task CRUD: direct operations on `tasks` table — RLS restricts to admin role
- Admin template CRUD: direct operations on `notification_templates`
- Admin moderation: direct update on `community_posts.is_hidden`
- Admin config: direct update on `spaced_repetition_config`

## Spaced-repetition algorithm

Based on SM-2 with ADHD-specific modifications. The algorithm is implemented as a **pure, stateless function** in `packages/shared/src/algorithm/spacedRepetition.ts` so it can be tested deterministically and shared between Edge Functions and (optionally) client-side preview.

### Core formula
```
new_interval = old_interval * ease_factor
new_ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
```

### ADHD modifications
- **Shorter initial intervals**: first review at 1 day (not 1 day then 6 days like standard SM-2). ADHD users need more frequent early reinforcement.
- **Struggle detection**: if `quick_rating <= struggle_threshold` (default 2) or `tried_it == false`, the algorithm flags the task for extended practice and reduces the interval.
- **Multi-day extension**: if a task is flagged as struggling, the current active task can be extended by 1–2 additional days before the next task unlocks. UI displays "Day X (1 of N)".
- **Review cap**: maximum `max_reviews_per_day` (default 1) reinforcement review per day (alongside the active task) to avoid overwhelm.
- **Decay boost**: if a user misses multiple days, the algorithm shortens intervals for recent tasks to re-establish momentum.
- **Post-completion**: after all 30 tasks are completed, the algorithm continues scheduling reviews to maintain long-term retention.

### Tunable parameters (admin-configurable via `spaced_repetition_config` table)
- `base_interval_days`: starting interval for first review (default: 1)
- `ease_floor`: minimum ease factor (default: 1.3)
- `struggle_threshold`: rating at or below which triggers extended practice (default: 2)
- `max_reviews_per_day`: cap on reinforcement reviews (default: 1)
- `decay_multiplier`: how aggressively to shorten intervals after inactivity (default: 0.5)

## Notification engine

### Scheduling logic
1. The `daily-notifications` Edge Function is triggered hourly by pg_cron → pg_net (see pg_cron section above).
2. For each active user (including post-completion users), based on their timezone and quiet hours:
   a. Check if user has already been notified today → skip if so.
   b. Check if current time is within their notification window (default 08:00–21:00 in their timezone) → skip if outside.
   c. Select ONE channel for the day (rotating: push → email → push → email, based on `notification_log` history).
   d. Select a template from the pool for that channel, weighted by tone_tag diversity and recency (don't repeat same tone_tag two days in a row, don't reuse same template within 7 days).
   e. Interpolate template variables with user's current state (task title, streak, day number, name).
   f. Dispatch: push via FCM HTTP v1 API, email via Resend API.
   g. Log to `notification_log`.
3. For post-completion users: the notification references the algorithmically-selected review task instead of an active task.

### Quiet hours
- Notifications are only sent within the user's configured window (default: 8am–9pm in their timezone).
- If the hourly cron run falls outside the window, the user is skipped until the next run that falls inside.

### Push notification flow (FCM)
1. Mobile app registers for push via `expo-notifications` → gets Expo push token or FCM token.
2. Token is stored in `push_tokens` table.
3. Edge Function sends to FCM HTTP v1 API with the token.
4. For iOS: FCM forwards to APNs (requires APNs key uploaded in Firebase Console).
5. **Requires Expo Dev Build** — push token registration doesn't work in Expo Go.

### Email flow (Resend)
1. Edge Function calls Resend API with recipient email, subject, and HTML body.
2. Templates are stored in `notification_templates` table and rendered server-side.

### Stub mode
If `FCM_SERVER_KEY` or `RESEND_API_KEY` env vars are missing:
- Log `[STUB] FCM not configured — skipping push send` or `[STUB] Resend not configured — skipping email send`.
- Return mock success. Never crash.
- Template selection, channel rotation, and notification_log still execute normally.

## Offline strategy

### What works offline (mobile)
- Viewing the current active task (cached via TanStack Query)
- Viewing completed tasks and check-in history (cached)
- Submitting a check-in (queued in Zustand persist store **with client-side timestamp**)
- Viewing the progress map

### What requires connectivity
- Unlocking the next task (Edge Function validates progression)
- Community threads (real-time data via Supabase Realtime)
- Payment verification
- Notification preferences
- Quiz

### Sync approach
- TanStack Query handles caching and background refetch for all read operations.
- Zustand with `persist` middleware stores offline check-in queue. Each queued item includes `checked_in_at` (the client timestamp when the user tapped submit).
- On reconnect, queued check-ins are replayed to the `complete-check-in` Edge Function with the original `checked_in_at` timestamp.
- The Edge Function uses `checked_in_at` (not server time) for time-gate calculations — so a check-in at 23:59 offline that syncs at 02:00 still counts as the previous day.
- Conflict resolution: server state wins for progression; check-in data is append-only (no conflict).

## Payment flow (RevenueCat)

### Price
**£8 one-time purchase** (~$10 USD equivalent). Configured in RevenueCat dashboard as a non-renewing purchase. Currency conversion handled by App Store / Google Play.

### Purchase
1. User hits the paywall at task 16.
2. App calls RevenueCat SDK (`Purchases.purchasePackage()`), which handles StoreKit/Google Play Billing.
3. RevenueCat validates the receipt automatically.
4. App checks entitlement via `Purchases.getCustomerInfo()`.
5. A RevenueCat webhook (or client-initiated call to `verify-payment` Edge Function) updates `profiles.payment_status = 'paid'` in Supabase.
6. App unlocks tasks 16–30.

### Dev mode bypass
If `REVENUECAT_PUBLIC_SDK_KEY` is missing:
- Paywall screen renders normally but shows a "Dev mode: tap to unlock paid tier" button.
- Tapping it directly sets `profiles.payment_status = 'paid'` via Supabase client.
- This allows full flow testing without RevenueCat credentials or a native dev build.

### Entitlement checking
- On app launch: check RevenueCat `customerInfo.entitlements.active` + fallback to `profiles.payment_status` from Supabase.
- RevenueCat handles refunds, family sharing, and cross-platform entitlements automatically.
- No manual receipt validation code needed.

### Native build requirement
`react-native-purchases` is a native module. It requires an **Expo Development Build** (via EAS Build or local Xcode/Android Studio). It does NOT work in Expo Go. The dev mode bypass exists specifically so the agent can test the paywall flow in Expo Go without the native module.

## Security considerations

- Auth handled entirely by Supabase Auth (bcrypt passwords, JWT, refresh tokens, rate limiting built-in).
- **Email confirmation enabled**: users must confirm their email before signing in (production default). App implements a "Check your email" screen after registration. Local dev uses Inbucket (localhost:54324) to capture confirmation emails.
- All tables use Row Level Security — no data leaks even if client code has bugs. **Each user can only see their own data.**
- **Never log PII**: no user emails, passwords, payment receipts, or personal data in console.log, Edge Function logs, or error tracking. Log user IDs (UUIDs) only.
- Community posts sanitized for XSS on insert (Edge Function or Postgres function).
- Admin CMS behind role check in RLS policies (`profiles.role = 'admin'`).
- Payment entitlements validated by RevenueCat server-side (never trust the client).
- Supabase encrypts data at rest.
- GDPR-ready: Supabase supports user data export; add a delete-account Edge Function that cascades all user data.
- Service role key is NEVER exposed to clients — only used in Edge Functions and pg_net calls.
- CORS headers on Edge Functions scoped to allow the web dashboard origin.

## Error handling

- **Global error boundary** (React): catches unhandled JS errors in the mobile app and shows a friendly "Something went wrong" screen with a retry button. Never a blank white screen.
- **Network errors**: all Supabase calls and Edge Function invocations wrapped in try/catch. On failure: show a user-friendly toast message (e.g., "Couldn't load your tasks — check your connection and try again"). Use TanStack Query's `onError` callbacks.
- **Edge Function errors**: return structured JSON `{ error: "message" }` with appropriate HTTP status codes. Never return raw stack traces.
- **Offline resilience**: check-ins queue locally, task content is cached, progress map is cached. The app degrades gracefully — users can still see their current task and submit check-ins without internet.
- **Validation errors**: return clear messages (e.g., "Rating must be between 1 and 5") so the client can display them.

## Local development with Supabase CLI

For local development without a cloud Supabase project:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase stack (Postgres, Auth, Storage, Edge Functions, Studio)
supabase start

# This gives you:
# - Local Postgres on port 54322
# - Local Auth on port 54321
# - Supabase Studio (admin UI) on http://localhost:54323
# - Inbucket (email testing) on http://localhost:54324
# - Local anon key and service role key printed to terminal

# Apply migrations and seed
supabase db reset

# Generate TypeScript types from local schema
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Serve Edge Functions locally (with env vars)
supabase functions serve --env-file .env.local

# Seed data
# (handled by `supabase db reset` which runs seed.sql automatically)
```

This means the agent can scaffold, migrate, seed, and test the entire backend **without any cloud credentials**.

### Inbucket for email testing
Local Supabase routes all auth emails (confirmation, password reset) to Inbucket at http://localhost:54324. No real SMTP needed for local dev.

## Known temporary regressions (must fix before release)

- **`useReducedMotion` stubbed**: `apps/mobile/src/hooks/useReducedMotion.ts` currently returns `{ reducedMotion: false }` hardcoded. The `AccessibilityInfo` listener and `useProfilePreferences` integration were removed to get Expo running. Must be restored before release.
- **Auth email confirmation bypassed**: `enable_confirmations = false` in `supabase/config.toml`, plus navigation bypasses in `RegisterScreen.tsx` and `RegisterForm.tsx`. Must revert all three before deploy.
- **React pinned to 19.2.0**: Downgraded from 19.2.4 for RN 0.83 compatibility. Monitor for upstream fixes.
- **Shared package linked via `file:` protocol**: `@focuslab/shared` uses `"file:../../packages/shared"` in mobile `package.json`. May need adjustment for EAS builds.

## Future extensibility (V2 — keep in mind, don't build yet)

- **Home screen widget**: iOS WidgetKit + Android Glance. Native Swift/Kotlin code. Data bridge via shared app storage.
- **Native mindful gateway**: App-intercept with breathing overlay + timed check-ins. Requires Accessibility Service (Android) / Screen Time API (iOS). Primary post-completion engagement feature.
- **Work hub desktop mode**: Tasks breakdown, break reminders, white noise, focus timer.
- **"Not relevant" skip option**: Let users skip inapplicable tasks. Algorithm adjusts accordingly.
- **Adaptive task cards**: Break struggling tasks into smaller steps based on check-in feedback.
- **Multiple journeys**: Anxiety, motivation, etc. — `journey_id` column is already in place.
- **SMS notifications**: Additional channel in the notification engine (Twilio).
- **AI-powered insights**: Analyze check-in patterns to provide personalized recommendations.
- **Advanced community**: Word filter, auto-moderation, trending posts.
