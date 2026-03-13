# FocusLab Architecture

FocusLab is a mobile-first ADHD journey app with a cloud-synced backend, admin CMS, and native home screen widgets. The architecture prioritizes offline resilience, low-friction interactions, and an algorithm-driven reinforcement engine that adapts to each user's progress.

## Guiding principles

- Retention over cleverness: every architectural choice serves user engagement.
- Offline-first mobile: the current task and recent check-ins work without internet.
- Content-driven: task content lives in the database, managed via admin CMS, not hardcoded.
- Algorithm-tunable: spaced-repetition parameters are configurable without code changes.
- Managed services first: use Supabase, FCM, Resend, and RevenueCat to minimize self-hosted infrastructure. No Docker, no Redis, no custom auth middleware.

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
| Testing | Vitest (shared + Edge Functions), Jest + React Native Testing Library (mobile), Vitest (web) | Fast, TS-native, consistent across packages |
| Monorepo | Turborepo | Caching, task orchestration, works well with Expo + Next.js |
| Styling (mobile) | NativeWind (Tailwind for RN) | Consistent with web Tailwind, utility-first |
| Linting | ESLint + Prettier | Standard, zero-warnings policy |
| Type generation | `supabase gen types typescript` | Auto-generates TS types from Postgres schema — single source of truth |

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
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Expo / Mobile — same Supabase values, prefixed for Expo
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
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

# Supabase Edge Functions use these via Supabase Secrets (set with `supabase secrets set`):
# FCM_SERVER_KEY, RESEND_API_KEY, REVENUECAT_SECRET_KEY
```

### Credential setup checklist (human must do before agent can test)

1. **Supabase project** — Create at supabase.com. Copy URL + anon key + service role key.
2. **Firebase project** — Create at console.firebase.google.com. Enable Cloud Messaging. Copy server key. Upload APNs key for iOS.
3. **Resend account** — Sign up at resend.com. Create API key. Verify sender domain (or use onboarding@resend.dev for testing).
4. **RevenueCat account** — Sign up at revenuecat.com. Create app entries for iOS + Android. Copy public SDK key.
5. **Apple Developer account** — Required for iOS builds, push certs, and App Store IAP. Not needed for Expo Go testing.
6. **Google Play Console** — Required for Android production IAP. Not needed for dev.

### What the agent CAN test without credentials

- All Supabase operations work locally with `supabase start` (local dev stack — no cloud account needed for initial development).
- Spaced-repetition algorithm is pure logic — no external deps.
- UI components and navigation — Expo Go, no credentials needed.
- Web dashboard — runs against local Supabase.
- Edge Functions — testable locally with `supabase functions serve`.

## Data model

All tables live in Supabase Postgres. Schema is managed via SQL migration files in `supabase/migrations/`. Types are auto-generated with `supabase gen types typescript`.

### profiles (extends Supabase auth.users)
- `id` (uuid, FK → auth.users.id, primary key)
- `name` (text)
- `avatar_url` (text, nullable)
- `role` (text, default 'user' — values: 'user', 'admin')
- `payment_status` (text, default 'free' — values: 'free', 'paid')
- `payment_receipt` (jsonb, nullable)
- `notification_preferences` (jsonb — `{ channels: [], quiet_start: "21:00", quiet_end: "08:00", timezone: "America/New_York" }`)
- `onboarding_complete` (boolean, default false)
- `motivating_answer` (text, nullable — from onboarding, max 200 chars)
- `theme_preference` (text, default 'light' — values: 'light', 'dark', 'system')
- `created_at`, `last_active_at`

Note: Supabase Auth handles email, password hash, OAuth providers, JWT tokens, and refresh tokens automatically. The `profiles` table stores app-specific data, linked by `id` to `auth.users.id`. A database trigger auto-creates a profile row on signup.

### tasks (admin-authored content)
- `id` (uuid, primary key)
- `order` (integer, 1–30, unique)
- `title` (text)
- `task_body` (text — markdown, the immediate action)
- `explanation_body` (text — markdown, the why)
- `deeper_reading` (text, nullable — markdown, optional)
- `difficulty_rating` (integer, 1–5, used by spaced-repetition)
- `default_duration_days` (integer, default 1 — 2–3 for complex tasks)
- `tags` (text[] — for categorization and search)
- `is_active` (boolean, default true — admin can draft/unpublish)
- `created_at`, `updated_at`

### user_progress
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `status` (text — 'locked', 'active', 'in_review', 'completed')
- `unlocked_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)
- `current_day` (integer, default 1 — for multi-day tasks)
- `extended_by_algorithm` (boolean, default false)
- Unique constraint on `(user_id, task_id)`

### check_ins
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `type` (text — 'completion', 'reinforcement_review')
- `quick_rating` (integer, 1–5)
- `tried_it` (boolean)
- `prompt_responses` (jsonb, nullable — `{ what_happened: "", what_was_hard: "", what_surprised: "" }`)
- `time_spent_seconds` (integer)
- `created_at` (timestamptz)

### spaced_repetition_state
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles.id)
- `task_id` (uuid, FK → tasks.id)
- `ease_factor` (real, default 2.5)
- `interval_days` (real, default 1)
- `review_count` (integer, default 0)
- `next_review_date` (date)
- `last_review_rating` (integer, nullable)
- Unique constraint on `(user_id, task_id)`

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

## Row Level Security (RLS) policies

All tables have RLS enabled. Policies:

- **profiles**: Users can read/update their own row. Admins can read all.
- **tasks**: Anyone authenticated can read active tasks. Only admins can insert/update/delete.
- **user_progress**: Users can read/insert/update their own rows. Admins can read all.
- **check_ins**: Users can read/insert their own rows. Admins can read all.
- **spaced_repetition_state**: Users can read/update their own rows. Service role (Edge Functions) can update any.
- **community_posts**: Users can read posts for tasks they've unlocked (checked via user_progress). Users can insert their own posts. Admins can update `is_hidden`.
- **community_reactions / community_replies**: Same gating as community_posts.
- **notification_log**: Users can read their own. Service role can insert.
- **notification_templates**: Anyone authenticated can read active templates. Admins can CRUD.
- **spaced_repetition_config**: Anyone authenticated can read. Admins can update.
- **push_tokens**: Users can read/insert/delete their own. Service role can read all.

## API design

Supabase provides an auto-generated REST API (PostgREST) for all tables. For simple CRUD (read tasks, insert check-ins, update profiles), use the Supabase JS client directly — no custom API code needed.

Custom business logic lives in **Supabase Edge Functions** (Deno runtime, deployed with `supabase functions deploy`):

### Edge Functions (custom logic only)

- `complete-check-in` — Validates check-in, updates user_progress, triggers spaced-repetition recalculation, enforces time-gating. Called instead of raw insert to `check_ins` table.
- `get-journey-state` — Returns the user's full journey state: current task, streak, reinforcement review (if any), progress map. Aggregates multiple tables into one response.
- `daily-notifications` — Cron-triggered (via Supabase pg_cron or external cron). Iterates users, selects channel + template, sends via FCM/Resend.
- `daily-reviews` — Cron-triggered. Computes which users need reinforcement reviews today, updates spaced_repetition_state.
- `verify-payment` — Receives RevenueCat webhook or client-side receipt, updates payment_status.
- `admin-analytics` — Aggregates user stats (drop-off points, completion rates, popular threads) for admin dashboard.

### Direct Supabase client calls (no Edge Function needed)

- Auth: `supabase.auth.signUp()`, `signInWithPassword()`, `signInWithOAuth()`, `getSession()`, `refreshSession()`
- Read tasks: `supabase.from('tasks').select('*').order('order')`
- Read progress: `supabase.from('user_progress').select('*').eq('user_id', userId)`
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
- **Struggle detection**: if `quick_rating <= 2` or `tried_it == false`, the algorithm flags the task for extended practice and reduces the interval.
- **Multi-day extension**: if a task is flagged as struggling, the current active task can be extended by 1–2 additional days before the next task unlocks.
- **Review cap**: maximum 1 reinforcement review per day (alongside the active task) to avoid overwhelm.
- **Decay boost**: if a user misses multiple days, the algorithm shortens intervals for recent tasks to re-establish momentum.

### Tunable parameters (admin-configurable via `spaced_repetition_config` table)
- `base_interval_days`: starting interval for first review (default: 1)
- `ease_floor`: minimum ease factor (default: 1.3)
- `struggle_threshold`: rating at or below which triggers extended practice (default: 2)
- `max_reviews_per_day`: cap on reinforcement reviews (default: 1)
- `decay_multiplier`: how aggressively to shorten intervals after inactivity (default: 0.5)

## Notification engine

### Scheduling logic
1. The `daily-notifications` Edge Function is triggered by a cron schedule (via `pg_cron` extension or Supabase's built-in cron).
2. For each active user (based on their timezone and quiet hours):
   a. Select ONE channel for the day (rotating: push → email → push → email, based on `notification_log` history).
   b. Select a template from the pool for that channel, weighted by tone_tag diversity and recency.
   c. Interpolate template variables with user's current state (task title, streak, day number, name).
   d. Dispatch: push via FCM HTTP v1 API, email via Resend API.
   e. Log to `notification_log`.

### Quiet hours
- Notifications are only sent within the user's configured window (default: 8am–9pm in their timezone).
- If the cron run falls outside the window, the notification is deferred to the next valid time.

### Push notification flow (FCM)
1. Mobile app registers for push via `expo-notifications` → gets Expo push token or FCM token.
2. Token is stored in `push_tokens` table.
3. Edge Function sends to FCM HTTP v1 API with the token.
4. For iOS: FCM forwards to APNs (requires APNs key uploaded in Firebase Console).

### Email flow (Resend)
1. Edge Function calls Resend API with recipient email, subject, and HTML body.
2. Templates are stored in `notification_templates` table and rendered server-side.

## Offline strategy

### What works offline (mobile)
- Viewing the current active task (cached via TanStack Query)
- Viewing completed tasks and check-in history (cached)
- Submitting a check-in (queued in Zustand persist store, synced when online)
- Viewing the progress map

### What requires connectivity
- Unlocking the next task (Edge Function validates progression)
- Community threads (real-time data via Supabase Realtime)
- Payment verification
- Notification preferences
- Widget data refresh

### Sync approach
- TanStack Query handles caching and background refetch for all read operations.
- Zustand with `persist` middleware stores offline check-in queue.
- On reconnect, queued check-ins are replayed to the `complete-check-in` Edge Function.
- Conflict resolution: server state wins for progression; check-in data is append-only (no conflict).

## Widget architecture

### Data flow
1. `get-journey-state` Edge Function returns: `{ day: 12, total: 30, streak: 5, task_title: "Urge Surfing" }`
2. Mobile app fetches this on each task unlock and caches it in shared app group storage (iOS) / SharedPreferences (Android) via `expo-shared-preferences` or a native module.
3. The widget reads from shared storage — never calls the network directly.
4. Widget refreshes via iOS `WidgetKit` timeline / Android `WorkManager` periodic sync.

### Display
- Progress ring or bar (day / 30)
- Streak count
- Truncated task title
- Tap → deep link to current task screen

## Payment flow (RevenueCat)

### Purchase
1. User hits the paywall at task 16.
2. App calls RevenueCat SDK (`Purchases.purchasePackage()`), which handles StoreKit/Google Play Billing.
3. RevenueCat validates the receipt automatically.
4. App checks entitlement via `Purchases.getCustomerInfo()`.
5. A RevenueCat webhook (or client-initiated call to `verify-payment` Edge Function) updates `profiles.payment_status = 'paid'` in Supabase.
6. App unlocks tasks 16–30.

### Entitlement checking
- On app launch: check RevenueCat `customerInfo.entitlements.active` + fallback to `profiles.payment_status` from Supabase.
- RevenueCat handles refunds, family sharing, and cross-platform entitlements automatically.
- No manual receipt validation code needed.

## Security considerations

- Auth handled entirely by Supabase Auth (bcrypt passwords, JWT, refresh tokens, rate limiting built-in).
- All tables use Row Level Security — no data leaks even if client code has bugs.
- Community posts sanitized for XSS on insert (Edge Function or Postgres function).
- Admin CMS behind role check in RLS policies (`profiles.role = 'admin'`).
- Payment entitlements validated by RevenueCat server-side (never trust the client).
- Supabase encrypts data at rest.
- GDPR-ready: Supabase supports user data export; add a delete-account Edge Function that cascades.
- Service role key is NEVER exposed to clients — only used in Edge Functions.

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
# - Local anon key and service role key printed to terminal

# Run migrations
supabase db push

# Generate TypeScript types from local schema
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Serve Edge Functions locally
supabase functions serve

# Seed data
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql
```

This means the agent can scaffold, migrate, seed, and test the entire backend **without any cloud credentials**.

## Future extensibility (keep in mind, don't build yet)

- **Work hub desktop mode**: tasks breakdown, break reminders, white noise, focus timer.
- **Native mindful gateway**: app-intercept overlays for Android (Accessibility Service) and iOS (Screen Time API).
- **SMS notifications**: additional channel in the notification engine (Twilio).
- **Multiple journeys**: anxiety, motivation, etc. — add a `journey_id` column to tasks and user_progress even in V1 (default to a single journey UUID).
- **AI-powered insights**: analyze check-in patterns to provide personalized recommendations.
- **Supabase Realtime for live community**: subscribe to new posts/replies in real-time (infrastructure already supports it).
