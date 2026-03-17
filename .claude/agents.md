# Repository Guidelines

## Project Structure & Module Organization

```
focuslab/
├── apps/
│   ├── mobile/                # React Native + Expo (SDK 52+) — iOS + Android
│   │   ├── src/
│   │   │   ├── screens/       # Screen components by feature (journey/, community/, progress/, auth/, onboarding/, payment/, completion/, settings/)
│   │   │   ├── components/    # Shared UI components
│   │   │   ├── navigation/    # Tab + stack navigation (Expo Router — file-based routing)
│   │   │   ├── stores/        # Zustand stores (local UI state, offline queue)
│   │   │   ├── hooks/         # Custom hooks (useHaptics, useJourneyProgress, useSupabase)
│   │   │   ├── lib/           # Supabase client init, RevenueCat init, query keys
│   │   │   ├── animations/    # Spring animation configs (react-native-reanimated withSpring — see design.md for values)
│   │   │   └── theme/         # Colors, typography, spacing tokens (NativeWind)
│   │   ├── app.config.ts      # Expo config (with plugins for notifications, RevenueCat)
│   │   ├── eas.json           # EAS Build profiles (development, preview, production)
│   │   └── tailwind.config.js # NativeWind config
│   │
│   └── web/                   # Next.js 14+ (App Router) — admin CMS + user dashboard
│       ├── src/
│       │   ├── app/           # App Router pages (admin/, dashboard/, auth/)
│       │   ├── components/    # Shared UI components
│       │   ├── lib/           # Supabase client init (server + client), query keys
│       │   └── hooks/         # Custom hooks
│       ├── tailwind.config.js
│       └── next.config.js
│
├── packages/
│   └── shared/                # Shared TypeScript types + pure utility functions
│       └── src/
│           ├── types/         # Auto-generated DB types (database.ts) + app-level types
│           └── algorithm/     # Spaced-repetition algorithm (pure, testable, no deps)
│               └── __tests__/ # Algorithm unit tests
│
├── supabase/                  # Supabase project config (managed by Supabase CLI)
│   ├── migrations/            # SQL migration files (schema changes)
│   ├── functions/             # Edge Functions (Deno runtime)
│   │   ├── _shared/           # Shared utilities (CORS headers, response helpers)
│   │   │   └── cors.ts
│   │   ├── complete-check-in/
│   │   ├── get-journey-state/
│   │   ├── daily-notifications/
│   │   ├── daily-reviews/
│   │   ├── verify-payment/
│   │   └── admin-analytics/
│   ├── seed.sql               # Seed data (30 tasks, quiz questions, notification templates, SR config, admin user)
│   └── config.toml            # Supabase local dev config
│
├── content/                   # Source content for the 30 journey tasks (human-authored drafts)
│   ├── 30-tasks-draft.md      # The 30 task definitions — use this to populate seed data and CMS
│   └── quiz-questions.json    # Placeholder quiz questions (30 items, one per task)
├── scripts/
│   └── make-admin.ts          # CLI script to promote a user to admin role
├── .claude/                   # Project spec files (prompt, plans, architecture, design, implementation rules)
├── .env.example               # Required environment variables (never real values)
├── turbo.json                 # Turborepo config
├── package.json               # Workspace root
└── tsconfig.json              # Root TS config
```

Key differences from a traditional API server setup:
- **No `apps/api/` directory.** Supabase replaces the custom API server. CRUD operations use the Supabase JS client directly. Business logic lives in `supabase/functions/` (Edge Functions).
- **No ORM.** Types are auto-generated from the Postgres schema via `supabase gen types typescript`.
- **No Redis.** Supabase handles sessions/auth; TanStack Query handles client-side caching.

## Build, Test, and Development Commands

### Prerequisites
- Node.js 20+ (LTS)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker Desktop (required by `supabase start` for local dev stack)
- Expo CLI (`npx expo`)
- Turborepo (`npx turbo`)

### Dev (run from repo root)
- `supabase start` — Start local Supabase stack (Postgres, Auth, Storage, Studio at localhost:54323)
- `supabase functions serve` — Serve Edge Functions locally
- `npx turbo dev` — Start mobile + web dev servers concurrently
- `npx expo start` (from `apps/mobile/`) — Start Expo dev server
- `npm run dev` (from `apps/web/`) — Start Next.js dev server

### Build
- `npx turbo build` — Production builds for all apps
- `eas build --profile development` — Expo Development Build (required for native modules: RevenueCat, push notifications)
- `eas build --profile production` — Production mobile builds

### Verification (run after every milestone)
- `npx turbo lint` — ESLint across monorepo (zero warnings)
- `npx turbo typecheck` — Strict TS checks without emitting
- `npx turbo test` — All unit + integration tests
- `npx turbo test -- --watch` — Watch mode during development

### Database
- `supabase db push` — Apply migrations to local DB
- `supabase db reset` — Reset local DB + re-apply all migrations + run seed
- `supabase gen types typescript --local > packages/shared/src/types/database.ts` — Regenerate TS types after schema changes
- `supabase functions deploy <name>` — Deploy an Edge Function to production

### Admin
- `npx tsx scripts/make-admin.ts admin@example.com` — Promote a user to admin role

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts` / `.tsx`) across all apps and packages. Edge Functions use TypeScript on Deno runtime.
- Indentation: 2 spaces; prefer clear, explicit code over cleverness.
- Components: PascalCase filenames (for example, `TaskScreen.tsx`, `CheckInSheet.tsx`).
- Hooks: `useX.ts` (for example, `useHaptics.ts`, `useJourneyProgress.ts`).
- Stores: `xStore.ts` (for example, `offlineQueueStore.ts`, `onboardingStore.ts`) — Zustand stores.
- Edge Functions: kebab-case directory names matching the function name (for example, `complete-check-in/index.ts`).
- Supabase client: initialized once in `lib/supabase.ts` per app, imported everywhere.
- Styling: NativeWind (Tailwind for RN) on mobile, Tailwind CSS on web. Use design tokens from `theme/` for colors, spacing, typography.
- Linting: ESLint + Prettier. Zero warnings allowed. Run lint before all commits.
- **Error handling**: Every network call in try/catch. Show user-friendly toast messages on failure — never raw errors or stack traces. Edge Functions return structured JSON errors.
- **Security**: Never log PII (emails, passwords, payment info). Log user IDs (UUIDs) only. Service role key never in client code.
- **CORS**: All Edge Functions return CORS headers via `supabase/functions/_shared/cors.ts`.

## Testing Guidelines
- Framework: Vitest for `packages/shared/` and `apps/web/`. Jest + React Native Testing Library for `apps/mobile/`. Deno test for Edge Functions.
- Location: co-locate tests in `__tests__` directories alongside source.
- Naming: `*.test.ts` / `*.test.tsx`.
- Critical test coverage (must exist before milestone is marked done):
    - Spaced-repetition algorithm: deterministic — same inputs always produce same output.
    - Journey progression logic: unlock gating, time gating, multi-day extension, reinforcement insertion.
    - Check-in validation: required fields, rating bounds, time-gate enforcement.
    - Notification scheduling: template rotation, channel cycling, quiet hours.
    - Paywall gating: free users blocked at task 16, paid users pass through.
- Always run before merging: `npx turbo lint && npx turbo typecheck && npx turbo test`

## Commit & Pull Request Guidelines
- Follow conventional commits: `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`.
- Keep commits focused and scoped to a single change.
- PRs should include:
    - A short problem/solution summary.
    - Clear validation steps/commands.
    - Screenshots or recordings for UI changes (especially mobile).

## Architecture Notes (Quick Map)

### Business logic (Edge Functions — `supabase/functions/`)
- `complete-check-in/` — Validates check-in, updates progress, triggers SR recalculation, enforces time-gating.
- `get-journey-state/` — Aggregates user's current task, streak, reinforcement review, progress map.
- `daily-notifications/` — Cron job: selects channel + template per user, sends via FCM/Resend.
- `daily-reviews/` — Cron job: computes reinforcement reviews, updates spaced_repetition_state.
- `verify-payment/` — RevenueCat webhook handler, updates payment_status.
- `admin-analytics/` — Aggregates stats for admin dashboard.

### Pure shared logic (`packages/shared/`)
- Spaced-repetition algorithm: `src/algorithm/spacedRepetition.ts` — pure function, no DB deps.
- Auto-generated DB types: `src/types/database.ts` — regenerated on schema changes.
- App-level types: `src/types/` — journey state, check-in payloads, notification payloads, etc.

### Mobile app (`apps/mobile/`)
- Screens by feature: `src/screens/journey/`, `src/screens/community/`, `src/screens/progress/`, `src/screens/auth/`, `src/screens/onboarding/`, `src/screens/payment/`, `src/screens/completion/`, `src/screens/settings/`
- Supabase client: `src/lib/supabase.ts`
- Offline queue: `src/stores/offlineQueueStore.ts` (Zustand + persist)

### Web dashboard (`apps/web/`)
- Admin CMS: `src/app/admin/` (tasks, templates, moderation, analytics, SR config, rewards)
- User dashboard: `src/app/dashboard/` (stats, history)
- Auth pages: `src/app/auth/`
- Supabase clients: `src/lib/supabase-server.ts` (server components) + `src/lib/supabase-client.ts` (client components)

### Task content source
- `content/30-tasks-draft.md` — The human-authored 30 task definitions. Use this as the source of truth when writing `supabase/seed.sql` task rows and when populating the admin CMS.

### Database schema
- Managed via SQL migrations in `supabase/migrations/`.
- Seed data in `supabase/seed.sql` — 30 tasks (sourced from `content/30-tasks-draft.md`), sample notification templates, default SR config.
- See `architecture.md` for full table definitions, RLS policies, timezone handling, and security rules.

Note: Home screen widget is deferred to V2. Do not build native Swift/Kotlin widget code in V1.
