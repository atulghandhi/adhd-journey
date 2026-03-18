# FocusLab Documentation

This document is updated continuously as milestones land so it reflects reality.

## What FocusLab is

- A mobile-first ADHD journey app that guides users through a 30-task sequential program designed to build lasting focus habits.
- Content is drawn from ADHD research (Dr. Alok Kanojia's "30 Days with ADHD", HealthyGamerGG, motivational literature).
- The app uses gated progression, spaced reinforcement (SM-2 inspired algorithm), novelty-driven notifications, and community accountability to maximize retention for ADHD users.
- Platforms: iOS + Android (React Native + Expo, primary), Next.js web dashboard (admin CMS + user stats, secondary).
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions). No custom API server.

## Status

- Milestone 01 — Repo scaffold + tooling: complete
- Milestone 02 — Database schema + migrations + seed: not started
- Milestone 03 — Auth integration (Supabase Auth): not started
- Milestone 04 — Mobile app shell + onboarding: not started
- Milestone 05 — Journey engine: task display + progression: not started
- Milestone 06 — Check-in system: not started
- Milestone 07 — Spaced-repetition engine: not started
- Milestone 08 — Notification engine [NEEDS CREDENTIALS]: not started
- Milestone 09 — Community threads: not started
- Milestone 10 — Admin CMS: not started
- Milestone 11 — Payment + freemium gate [NEEDS CREDENTIALS]: not started
- Milestone 12 — Progress + stats: not started
- Milestone 13 — Mindful gateway tutorial: not started
- Milestone 14 — Post-completion phase: not started
- Milestone 15 — UX polish + animations: not started
- Milestone 16 — Admin analytics + moderation: not started
- Milestone 17 — Testing hardening + final sweep: not started

Note: Home screen widget is deferred to V2.

Bootstrap note:
- 2026-03-17: Implementation started from an almost-empty repository containing only spec files, content drafts, and Supabase local config.
- 2026-03-17: Milestone 01 completed with a working npm workspace, Expo mobile app, Next.js web app, shared package, Turbo pipelines, tests, and local startup verification.

## Local setup

### Prerequisites
- **Node.js 20+** (LTS)
- **Supabase CLI**: `brew install supabase/tap/supabase`
- **Docker Desktop**: required by `supabase start` to run the local Postgres, Auth, Storage, and Studio
- **Expo CLI**: included via `npx expo`
- **iOS development** (optional): Xcode + iOS Simulator
- **Android development** (optional): Android Studio + emulator

### First-time setup
```bash
# Clone the repo
git clone <repo-url> && cd focuslab

# Install dependencies
npm install

# Start local Supabase stack (requires Docker Desktop running)
supabase start

# Apply migrations and seed data
supabase db reset

# Generate TypeScript types from schema
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Copy environment template and fill in local values
cp .env.example .env.local
# Local Supabase values are printed by `supabase start` — copy them into .env.local

# Start all dev servers
npx turbo dev
```

### Dev commands
- `supabase start` — Start local Supabase stack (Postgres, Auth, Storage, Studio at localhost:54323, Inbucket email at localhost:54324)
- `supabase functions serve --env-file .env.local` — Serve Edge Functions locally with environment variables (Deno runtime)
- `npx turbo dev` — Start mobile (Expo) + web (Next.js) dev servers concurrently
- `npx expo start` (from `apps/mobile/`) — Start Expo dev server only
- `npm run dev` (from `apps/web/`) — Start Next.js dev server only
- `supabase stop` — Stop local Supabase stack
- `npx tsx scripts/make-admin.ts admin@example.com` — Promote a user to admin role

Verification notes from Milestone 01:
- In this environment, `supabase start` required `--exclude edge-runtime` because the bundled local Edge Runtime failed on a certificate error while fetching a remote Deno import. The rest of the stack started cleanly.
- In this environment, Expo CLI writes were redirected to `/tmp/focuslab-expo-home` so `npx turbo dev` could run inside the workspace without using `~/.expo`.

## Verification commands

Run after every milestone:
```bash
npx turbo lint        # ESLint across monorepo (zero warnings)
npx turbo typecheck   # Strict TypeScript checks
npx turbo test        # All unit + integration tests
supabase db reset     # Verify migrations + seed apply cleanly
```

Build:
```bash
npx turbo build       # Production builds for all apps
```

Database:
```bash
supabase db push                           # Apply pending migrations
supabase db reset                          # Reset + re-apply all migrations + seed
supabase gen types typescript --local > packages/shared/src/types/database.ts  # Regenerate types
supabase functions deploy <function-name>  # Deploy Edge Function to production
```

## Admin CMS usage

(Will be documented when Milestone 10 is complete.)
- Access: navigate to `/admin` on the web dashboard. Requires `profiles.role = 'admin'`.
- Task management: create, edit, reorder (drag-and-drop), delete the 30 journey tasks. Markdown editor for body fields.
- Notification templates: CRUD on `notification_templates` table — manage push and email templates with tone tags.
- Spaced-repetition config: edit base intervals, ease floor, struggle threshold, max reviews/day, decay multiplier.
- Community moderation: view reported posts, hide/unhide, delete.
- Reward bundle: upload files to Supabase Storage or manage external links.

## Notification configuration

(Will be documented when Milestone 08 is complete.)

### Required credentials
- **FCM_SERVER_KEY**: Firebase Cloud Messaging server key. Get from Firebase Console → Project Settings → Cloud Messaging.
- **RESEND_API_KEY**: Resend API key. Get from [resend.com/api-keys](https://resend.com/api-keys).
- **RESEND_FROM_EMAIL**: Verified sender email in Resend (e.g., `hello@focuslab.app`).

### Stub mode
If credentials are missing, the notification Edge Function logs `[STUB]` warnings and skips actual sends. The rest of the flow (template selection, channel rotation, notification log) still executes.

### Template management
- Templates are stored in the `notification_templates` table and managed via the admin CMS.
- Each template has: channel (push/email), subject/title, body with `{{variable}}` interpolation, tone_tag for diversity rotation.
- The `daily-notifications` Edge Function is triggered by pg_cron → pg_net and handles channel rotation, template selection, quiet hours, and dispatch.

## Payment flow testing

(Will be documented when Milestone 11 is complete.)

### Required credentials
- **REVENUECAT_PUBLIC_SDK_KEY**: RevenueCat public SDK key for mobile app.
- **REVENUECAT_SECRET_KEY**: RevenueCat secret key for webhook verification in `verify-payment` Edge Function.

### Dev mode bypass
If `REVENUECAT_PUBLIC_SDK_KEY` is missing, the paywall screen shows a "Dev mode: bypass payment" button that sets `profiles.payment_status = 'paid'` directly.

### Sandbox testing
- iOS: use App Store sandbox test accounts (Settings → App Store → Sandbox Account).
- Android: use Google Play test tracks or license testing.
- RevenueCat sandbox mode: SDK automatically uses sandbox when the app is in debug/development.

## Demo flow

1. Launch app → onboarding (name + motivating question) → Day 1 task appears
2. Read task, try it, tap "I did it" → quick check-in (emoji rating + did-you-try-it toggle)
3. Optional: fill in deeper reflection prompts
4. Next day: new task unlocked, previous task enters spaced-repetition pool
5. Reinforcement review card appears alongside active task when algorithm schedules it
6. Community: tap into task thread, see other users' experiences, post a win
7. Widget: home screen shows Day X/30 + streak + task title
8. Notification: receive a push notification with varied copy encouraging today's task
9. Day 16: paywall for free users, seamless continuation for paid users
10. Day 30: completion screen → quiz → reward bundle → option to restart

## Repo structure overview

See `agents.md` for the full annotated project structure. Key points:

```
focuslab/
├── apps/
│   ├── mobile/                # React Native + Expo — iOS + Android
│   │   └── src/screens/       # Organized by feature (journey/, community/, progress/, auth/, etc.)
│   └── web/                   # Next.js 14+ (App Router) — admin CMS + user dashboard
│       └── src/app/           # App Router pages (admin/, dashboard/, auth/)
├── packages/
│   └── shared/                # Shared TS types (auto-generated from DB) + spaced-repetition algorithm
├── supabase/
│   ├── migrations/            # SQL schema migrations
│   ├── functions/             # Edge Functions (Deno) — business logic
│   ├── seed.sql               # 30 tasks, notification templates, SR config
│   └── config.toml            # Local dev config
├── .claude/                   # Project spec files
├── .env.example               # All required environment variables
└── turbo.json                 # Turborepo pipeline config
```

**No `apps/api/` directory.** Supabase replaces the custom API server. CRUD via Supabase JS client, business logic via Edge Functions.

## Edge Functions reference

| Function | Trigger | Description |
|---|---|---|
| `get-journey-state` | HTTP (client call) | Returns current task, streak (timezone-aware), progress map, reinforcement review |
| `complete-check-in` | HTTP (client call) | Validates check-in (accepts `checked_in_at` for offline), updates progress, triggers SR recalculation |
| `daily-notifications` | pg_cron → pg_net (hourly) | Selects channel + template per user, dispatches via FCM/Resend. Handles post-completion users too. |
| `daily-reviews` | pg_cron → pg_net (daily) | Computes reinforcement reviews from SR algorithm |
| `verify-payment` | Webhook (RevenueCat) | Validates purchase, updates payment_status |
| `admin-analytics` | HTTP (admin call) | Aggregates stats for admin dashboard |

All Edge Functions return CORS headers via shared utility at `supabase/functions/_shared/cors.ts`.

pg_cron triggers Edge Functions via pg_net HTTP POST (pg_cron runs SQL only, cannot call HTTP directly). See `architecture.md` for the exact SQL setup.

## Environment variables reference

All variables are documented in `.env.example`. Required for production:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (local: from `supabase start` output) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only | Service role key (never expose to client) |
| `FCM_SERVER_KEY` | For push notifications | Firebase Cloud Messaging server key |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender email address |
| `REVENUECAT_PUBLIC_SDK_KEY` | For payments (mobile) | RevenueCat public SDK key |
| `REVENUECAT_SECRET_KEY` | For payments (webhook) | RevenueCat secret key for verification |

For local development, only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required (printed by `supabase start`). All other services gracefully stub when their keys are missing.

## Data model overview (high level)

- **profiles**: extends `auth.users` — display name, role, payment status, notification preferences, onboarding state, theme preference (light/dark/system), current_journey_id
- **tasks**: admin-authored content — title, task body (markdown), explanation, deeper reading, difficulty, order, tags, journey_id
- **user_progress**: per-user per-task state (locked → active → completed), timestamps, multi-day tracking, journey_id
- **check_ins**: quick rating + optional deeper reflections, tied to task + user + journey_id, includes `checked_in_at` (client timestamp for offline support)
- **spaced_repetition_state**: per-user per-task algorithm state (ease factor, interval, review count, next review date), journey_id
- **spaced_repetition_config**: admin-tunable algorithm parameters (singleton row)
- **community_posts / community_reactions / community_replies**: per-task discussion threads with reactions and replies. Thread access persists across journey restarts.
- **community_reports**: user-submitted reports for moderation
- **notification_log**: record of every sent notification (template, channel, status)
- **notification_templates**: admin-managed push/email templates with tone tags
- **push_tokens**: device tokens for FCM push notifications
- **quiz_questions**: per-task quiz questions (placeholder content for V1)

All tables have Row Level Security (RLS) policies. See `architecture.md` for the complete schema.

## Security

- **RLS on all tables**: Each user can only read/write their own data. Admin role has broader read access.
- **Never log PII**: No user emails, passwords, or payment details in any log output. Use user IDs (UUIDs) only.
- **Service role key**: NEVER exposed to client code. Only used in Edge Functions and pg_net calls.
- **XSS prevention**: Community post content sanitized on insert.
- **Auth**: Supabase Auth handles password hashing (bcrypt), JWT, refresh tokens, rate limiting. Email confirmation required.
- **Payment**: Entitlements validated server-side by RevenueCat. Never trust client-side payment status alone.
- **CORS**: Edge Functions return CORS headers for web dashboard access. Scope origin in production.

## Troubleshooting

### Common issues

- **`supabase start` fails**: Ensure Docker Desktop is running. Check that ports 54321–54324 are not in use. Try `supabase stop` then `supabase start` again.
- **`supabase db reset` fails**: Check SQL syntax in migrations. Look at the error message — it usually points to the exact line. Ensure `seed.sql` doesn't reference tables not yet created.
- **Types out of date**: After any migration change, regenerate: `supabase gen types typescript --local > packages/shared/src/types/database.ts`
- **Push notifications not delivering**: Check `FCM_SERVER_KEY` env var. If missing, stub mode is active (check logs for `[STUB]`). Verify device token is registered in `push_tokens` table.
- **Email not sending**: Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars. Verify sender domain in Resend dashboard.
- **Widget not updating (V2)**: Home screen widget is deferred to V2. If building it later: widget reads from shared app storage; ensure the app has written fresh data after task unlock. Requires native build.
- **Payment sandbox issues**: Ensure RevenueCat is configured with sandbox credentials. Check `verify-payment` Edge Function logs. Dev mode bypass is available when `REVENUECAT_PUBLIC_SDK_KEY` is missing.
- **Auth token expired**: Supabase JS client auto-refreshes tokens. If it fails, the user will be redirected to login. Check Supabase Auth logs in Studio (localhost:54323).
- **Edge Function not responding**: Run `supabase functions serve` to serve locally. Check Deno runtime errors in terminal output. Ensure the function directory name matches the invocation URL.
