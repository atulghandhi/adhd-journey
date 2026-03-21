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
- Milestone 02 — Database schema + migrations + seed: complete
- Milestone 03 — Auth integration (Supabase Auth): complete
- Milestone 04 — Mobile app shell + onboarding: complete
- Milestone 05 — Journey engine: task display + progression: complete
- Milestone 06 — Check-in system: complete
- Milestone 07 — Spaced-repetition engine: complete
- Milestone 08 — Notification engine [NEEDS CREDENTIALS]: implemented with stubs; local edge runtime still blocked by Supabase certificate issue
- Milestone 09 — Community threads: complete
- Milestone 10 — Admin CMS: complete
- Milestone 11 — Payment + freemium gate [NEEDS CREDENTIALS]: implemented with RevenueCat wrapper + dev bypass
- Milestone 12 — Progress + stats: complete
- Milestone 13 — Mindful gateway tutorial: complete
- Milestone 14 — Post-completion phase: complete
- Milestone 15 — UX polish + animations: complete (dark mode tokens on all screens, spring animations with 4 configs, haptics with 5 types, reduced motion support, skeleton shimmer)
- Milestone 16 — Admin analytics + moderation: complete
- Milestone 17 — Testing hardening + final sweep: complete (13 mobile unit tests, 29 EF equivalence tests, final dark mode sweep)
- **Phase 0 — UX bug fixes**: complete (ReactionPill for community reactions, ghost report button, username casing, reaction toggle bug fix)
- **Phases 1–6 — UX enhancement phases**: documented in `.claude/change-phase1.md` through `.claude/change-phase6.md`, pending implementation

Note: Home screen widget is deferred to V2.

UX enhancement phases (post-milestone, documented in `.claude/change-phase*.md`):
- Phase 0: Bug fixes — COMPLETE. Community emoji rendering (ReactionPill + EmojiText), report button de-emphasis, username casing, reaction toggle per-user fix.
- Phase 1: Data model — add `interaction_type` enum + `interaction_config` JSONB to tasks table.
- Phase 2: Interactive task renderers — TaskRenderer switch component, 6 interactive task types.
- Phase 3: Journey map overhaul — serpentine layout, animated nodes, streak badge always-visible.
- Phase 4: Done-for-today improvements — progress ring, motivational quotes, review card upgrade.
- Phase 5: Variable content format — assign interaction types to all 30 tasks, format hint icons.
- Phase 6: Account screen polish — segmented control, Switch toggles, delete account, dark mode borders.

Bootstrap note:
- 2026-03-17: Implementation started from an almost-empty repository containing only spec files, content drafts, and Supabase local config.
- 2026-03-17: Milestone 01 completed with a working npm workspace, Expo mobile app, Next.js web app, shared package, Turbo pipelines, tests, and local startup verification.
- 2026-03-17: Milestone 02 completed with the initial Postgres schema, RLS policies, seed data, generated database types, and a verified auth-to-profile trigger.
- 2026-03-17: Milestone 03 completed with Supabase auth clients, email/password flows on mobile and web, confirmation screens, password reset screens, and protected dashboard/journey route guards.
- 2026-03-17: Milestones 04-07 landed together around the new shared domain layer, Expo Router app shell, onboarding flow, journey screen, check-in flow, streak/progression logic, review scheduling, and offline queue replay.
- 2026-03-17: Milestones 08-16 now include Supabase Edge Functions for journey/check-in/reviews/notifications/payment/analytics, mobile community/progress/paywall/completion/account flows, a web admin CMS, moderation tools, analytics charts, and an admin-managed `reward_resources` table.
- 2026-03-17: `supabase functions serve --env-file .env.local` still fails locally before user code boots because the bundled Edge Runtime tries to import `https://deno.land/std/http/status.ts` and rejects the certificate chain with `UnknownIssuer`. This is an environment/runtime issue, not a FocusLab function syntax failure.

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
- `npm run make-admin -- admin@example.com` — Promote a user to admin role

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

- Access: navigate to `/admin` on the web dashboard. The server layout checks `profiles.role = 'admin'` and redirects non-admins back to `/dashboard`.
- Tasks: `/admin/tasks` lists all journey tasks with create, delete, and move up/down ordering controls. `/admin/tasks/[id]` provides markdown editing for the action/explanation/deeper-reading fields plus a phone-frame mobile preview.
- Notification templates: `/admin/templates` manages `notification_templates` rows for push/email copy, tone tags, and activation state.
- Spaced repetition config: `/admin/settings` edits the singleton `spaced_repetition_config` row.
- Rewards: `/admin/rewards` manages the `reward_resources` table used by the mobile Resources screen.
- Moderation: `/admin/moderation` loads reported/all/hidden community posts and lets admins hide/unhide/delete posts.
- Analytics: `/admin/analytics` visualizes completion rate, drop-off by task, notification open rate, popular threads, and moderation counts using `recharts`.

## Notification configuration

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
- Mobile registration: the Account screen can request notification permissions and store a device token in `push_tokens`.
- Local blocker: the local Supabase Edge Runtime currently fails before booting functions because of the `UnknownIssuer` certificate error described above, so local HTTP smoke-testing of Edge Functions remains blocked even though DB-triggered scheduling and code compilation are in place.

## Payment flow testing

(Will be documented when Milestone 11 is complete.)

### Required credentials
- **EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY**: RevenueCat public SDK key for the Expo mobile app.
- **REVENUECAT_SECRET_KEY**: RevenueCat secret key for webhook verification in `verify-payment` Edge Function.

### Dev mode bypass
If `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY` is missing, the paywall screen shows a "Dev mode: tap to unlock paid tier" button that sets `profiles.payment_status = 'paid'` directly.

### In-app flow
- `apps/mobile/src/lib/revenuecat.ts` lazy-loads `react-native-purchases`, configures the SDK when the public key is present, loads the current offering, and attempts to purchase the primary package.
- `apps/mobile/src/hooks/useEntitlement.ts` combines profile payment status with RevenueCat entitlement/offering checks for the paywall screen.
- The paywall price label falls back to `£8` when no live offering is available.

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
7. Progress tab: journey map + recent check-ins + streak snapshot
8. Notification: receive a push/email reminder with varied copy encouraging today's task
9. Day 16: paywall for free users, seamless continuation for paid users or dev bypass in Expo Go
10. Day 30: completion summary → quiz → reward bundle → option to restart

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
├── scripts/
│   └── make-admin.ts          # Promote a signed-up user to admin role
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
| `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY` | For payments (mobile) | RevenueCat public SDK key exposed to Expo |
| `REVENUECAT_SECRET_KEY` | For payments (webhook) | RevenueCat secret key for verification |

For local development, only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required (printed by `supabase start`). All other services gracefully stub when their keys are missing.

## Data model overview (high level)

- **profiles**: extends `auth.users` — display name, role, payment status, notification preferences, onboarding state, theme preference (light/dark/system), current_journey_id
- **tasks**: admin-authored content — title, task body (markdown), explanation, deeper reading, difficulty, order, tags, journey_id, **interaction_type** (enum: markdown/drag_list/timed_challenge/breathing_exercise/reflection_prompts/journal/community_prompt), **interaction_config** (JSONB, type-specific parameters)
- **user_progress**: per-user per-task state (locked → active → completed), timestamps, multi-day tracking, journey_id
- **check_ins**: quick rating + optional deeper reflections, tied to task + user + journey_id, includes `checked_in_at` (client timestamp for offline support), `prompt_responses.interaction_data` for interactive task output
- **spaced_repetition_state**: per-user per-task algorithm state (ease factor, interval, review count, next review date), journey_id
- **spaced_repetition_config**: admin-tunable algorithm parameters (singleton row)
- **community_posts / community_reactions / community_replies**: per-task discussion threads with reactions and replies. Thread access persists across journey restarts.
- **community_reports**: user-submitted reports for moderation
- **notification_log**: record of every sent notification (template, channel, status)
- **notification_templates**: admin-managed push/email templates with tone tags
- **push_tokens**: device tokens for FCM push notifications
- **quiz_questions**: per-task quiz questions (placeholder content for V1)

All tables have Row Level Security (RLS) policies. See `architecture.md` for the complete schema.

## New components (Phase 0)

- **`ReactionPill`** (`apps/mobile/src/components/ReactionPill.tsx`): Pill-shaped community reaction button using `AnimatedPressable`. Props: `emoji`, `count`, `active`, `onPress`. Active state tracks per-user (`user_id`) not just count > 0.
- **`EmojiText`** (`apps/mobile/src/components/ui/EmojiText.tsx`): Forces `Apple Color Emoji` font on iOS to prevent NativeWind font-weight stripping color from emoji. Props: `children`, `size`.
- **`PrimaryButton` update**: Now supports non-string children (type-checks `children` — wraps strings in `<Text>`, passes JSX through directly).

## Known temporary regressions

- **`useReducedMotion` stubbed**: Returns `{ reducedMotion: false }` hardcoded. `AccessibilityInfo` listener removed to get Expo running. Must restore before release.
- **Auth email confirmation bypassed**: `enable_confirmations = false` in `supabase/config.toml`, plus navigation bypasses in `RegisterScreen.tsx` (mobile) and `RegisterForm.tsx` (web). Must revert all three before deploy.
- **React pinned to 19.2.0**: Downgraded from 19.2.4 for RN 0.83 compatibility.
- **Shared package linked via `file:` protocol**: `@focuslab/shared` uses `"file:../../packages/shared"` in mobile `package.json`. May need adjustment for EAS builds.

## Dependency changes (Expo runtime fixes)

- Pinned all wildcard (`*`) mobile deps to specific versions compatible with Expo SDK 55 + RN 0.83
- Added `react-native-svg` (`^15.15.3`) as direct dependency
- Added `apps/mobile/App.tsx` (returns null — required entry point for Expo)
- Added `expo-router/babel` plugin to `babel.config.js`

## Security

- **RLS on all tables**: Each user can only read/write their own data. Admin role has broader read access.
- **Never log PII**: No user emails, passwords, or payment details in any log output. Use user IDs (UUIDs) only.
- **Service role key**: NEVER exposed to client code. Only used in Edge Functions and pg_net calls.
- **XSS prevention**: Community post content sanitized on insert.
- **Auth**: Supabase Auth handles password hashing (bcrypt), JWT, refresh tokens, rate limiting. Email confirmation required (currently bypassed for local testing — must revert before deploy).
- **Payment**: Entitlements validated server-side by RevenueCat. Never trust client-side payment status alone.
- **CORS**: Edge Functions return CORS headers for web dashboard access. Scope origin in production.

## Troubleshooting

### Common issues

- **`supabase start` fails**: Ensure Docker Desktop is running. Check that ports 54321–54324 are not in use. Try `supabase stop` then `supabase start` again.
- **`supabase db reset` fails**: Check SQL syntax in migrations. Look at the error message — it usually points to the exact line. Ensure `seed.sql` doesn't reference tables not yet created.
- **Types out of date**: After any migration change, regenerate: `supabase gen types typescript --local > packages/shared/src/types/database.ts`
- **Push notifications not delivering**: Check `FCM_SERVER_KEY` env var. If missing, stub mode is active (check logs for `[STUB]`). Verify device token is registered in `push_tokens` table.
- **Email not sending**: Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars. Verify sender domain in Resend dashboard.
- **`supabase functions serve` fails immediately**: In this environment the bundled Edge Runtime aborts before loading project code because it cannot validate `https://deno.land/std/http/status.ts` (`invalid peer certificate: UnknownIssuer`). This is currently an external runtime/certificate problem rather than a FocusLab import or syntax error.
- **Widget not updating (V2)**: Home screen widget is deferred to V2. If building it later: widget reads from shared app storage; ensure the app has written fresh data after task unlock. Requires native build.
- **Payment sandbox issues**: Ensure RevenueCat is configured with sandbox credentials. Check `verify-payment` Edge Function logs. Dev mode bypass is available when `REVENUECAT_PUBLIC_SDK_KEY` is missing.
- **Auth token expired**: Supabase JS client auto-refreshes tokens. If it fails, the user will be redirected to login. Check Supabase Auth logs in Studio (localhost:54323).
- **Edge Function not responding**: Run `supabase functions serve` to serve locally. Check Deno runtime errors in terminal output. Ensure the function directory name matches the invocation URL.


------------------------------------------



Current `HEAD` is `bf3ee51`, and it includes the easy smoke test in [scripts/test-delete-account.ts](/Users/atul.ghandhi/WebstormProjects/adhd-journey/scripts/test-delete-account.ts). I ran it locally and it passed.

For the backend smoke test, use:

```bash
supabase start
npm run test:delete-account
```

If Edge Runtime is broken on your corporate network, rebuild the local trust image first:

```bash
mkdir -p supabase/.local
security find-certificate -a -p -c "caadmin.netskope.com" -c "ca.ctm.eu.goskope.com" /Library/Keychains/System.keychain ~/Library/Keychains/login.keychain-db > supabase/.local/proxy-ca.pem
npm run supabase:edge-runtime:trust -- supabase/.local/proxy-ca.pem public.ecr.aws/supabase/edge-runtime:v1.71.0
supabase stop
supabase start
```

For iPhone on a Mac: use a dev build, not Expo Go. This repo already has `expo-dev-client` enabled in [apps/mobile/app.config.ts](/Users/atul.ghandhi/WebstormProjects/adhd-journey/apps/mobile/app.config.ts) and uses Expo SDK 55 in [apps/mobile/package.json](/Users/atul.ghandhi/WebstormProjects/adhd-journey/apps/mobile/package.json).

The practical flow is:

1. Plug the iPhone into the Mac, unlock it, trust the Mac, and enable Developer Mode if iOS prompts.
2. Install the dev client once:

```bash
cd /Users/atul.ghandhi/WebstormProjects/adhd-journey/apps/mobile
npx expo run:ios --device
```

3. Start Metro from the repo root:

```bash
cd /Users/atul.ghandhi/WebstormProjects/adhd-journey
npm run start --workspace @focuslab/mobile -- --tunnel
```

4. Open the installed `FocusLab` app on the phone.

Important: if your mobile env still points to `http://127.0.0.1:54321`, the phone will not reach your local Supabase. The cable helps install the app, but it does not make the phone’s `127.0.0.1` point to your Mac. For real phone testing, the easiest path is:
- use a staging/remote Supabase project in `.env.local`, or
- expose your local Supabase with a reachable tunnel/LAN URL and point `EXPO_PUBLIC_SUPABASE_URL` at that.

If you want, I can set up the next easiest step for you:
1. switch the mobile app to a staging Supabase config for device testing, or
2. help expose the local Supabase URL so the iPhone can hit your Mac directly.