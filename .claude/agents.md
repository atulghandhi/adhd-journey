# Repository Guidelines

## Naming

- The repository and npm scopes still use `focuslab` / `@focuslab/*`.
- The shipped product name in the apps is `Next Thing`.
- Treat `FocusLab` as the codebase namespace and `Next Thing` as the user-facing brand.

## Project Structure

```text
focuslab/
├── apps/
│   ├── mobile/                  # Expo 55 / React Native 0.83 app
│   │   ├── app/                 # Expo Router routes
│   │   │   ├── (tabs)/          # Visible tabs: Journey, Toolkit, Account
│   │   │   ├── auth/            # Login, register, confirm-email, forgot-password
│   │   │   ├── completion/      # Congrats, quiz, resources
│   │   │   ├── disrupt.tsx      # App Disrupt breathing screen
│   │   │   ├── disrupt-setup.tsx
│   │   │   ├── gateway-settings.tsx
│   │   │   └── journey/mindful-gateway.tsx
│   │   ├── modules/
│   │   │   ├── widget-data-bridge/
│   │   │   └── family-controls-bridge/   # Native iOS work in progress
│   │   ├── plugins/
│   │   │   ├── withTodayTaskWidget/
│   │   │   └── withFamilyControls/       # Present in tree, not yet enabled in app.config.ts
│   │   ├── src/
│   │   │   ├── animations/
│   │   │   ├── components/
│   │   │   │   ├── tasks/      # Interactive task renderers
│   │   │   │   └── ui/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   │   ├── account/
│   │   │   │   ├── auth/
│   │   │   │   ├── completion/
│   │   │   │   ├── disrupt/
│   │   │   │   ├── gateway/
│   │   │   │   ├── journey/
│   │   │   │   ├── onboarding/
│   │   │   │   ├── payment/
│   │   │   │   └── progress/
│   │   │   ├── stores/
│   │   │   └── test/
│   │   └── app.config.ts
│   └── web/                     # Next.js 16 App Router app
│       └── src/
│           ├── app/
│           │   ├── admin/
│           │   ├── auth/
│           │   └── dashboard/
│           ├── components/
│           ├── lib/
│           └── test/
├── packages/
│   └── shared/
│       └── src/
│           ├── algorithm/
│           ├── constants/
│           ├── journey/
│           ├── notifications/
│           ├── quiz/
│           ├── timezone.ts
│           └── types/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   ├── admin-analytics/
│   │   ├── complete-check-in/
│   │   ├── daily-notifications/
│   │   ├── daily-reviews/
│   │   ├── delete-account/
│   │   ├── get-journey-state/
│   │   ├── health/
│   │   └── verify-payment/
│   ├── migrations/
│   └── seed.sql
└── .claude/
```

## Current Product Surface

- Mobile auth, onboarding, journey progression, check-ins, skips, spaced repetition, paywall, completion quiz/resources, toolkit management, and account settings are implemented.
- The visible mobile tab bar currently exposes `Journey`, `Toolkit`, and `Account`. The `community` route still exists, but the tab is hidden with `href: null`.
- `App Disrupt` exists in two forms:
  - a lightweight tutorial / shortcuts path
  - a richer gateway flow with `gatewayStore`, settings UI, open limits, free windows, and native FamilyControls bridge files
- iOS widget support is already in the repo via `withTodayTaskWidget`.
- The web app includes the marketing page, auth routes, user dashboard, and admin CMS.

## Commands

### Root

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:ci`
- `npm run db:reset`
- `npm run db:types`
- `npm run mobile:env:sync`

### Mobile

- `npm run dev --workspace=@focuslab/mobile`
- `npm run test --workspace=@focuslab/mobile`
- `npm run typecheck --workspace=@focuslab/mobile`

### Web

- `npm run dev --workspace=@focuslab/web`
- `npm run test --workspace=@focuslab/web`
- `npm run test:e2e --workspace=@focuslab/web`

### Supabase

- `supabase start`
- `supabase db reset`
- `supabase functions serve --env-file .env.local`
- `supabase gen types typescript --local > packages/shared/src/types/database.ts`

## Working Notes

- When schema changes, regenerate `packages/shared/src/types/database.ts`.
- Journey and notification logic is shared twice:
  - source-of-truth app logic in `packages/shared/src/...`
  - Deno-compatible copies in `supabase/functions/_shared/domain.ts`
- If you change shared journey / notification behavior, keep the Deno copy aligned and run the equivalence tests in `packages/shared/src/__tests__/ef-equivalence.test.ts`.
- Widget code is real production code, not a placeholder. Do not treat widgets as deferred work.
- FamilyControls code exists in the worktree, but `apps/mobile/app.config.ts` still only enables `withTodayTaskWidget`. Native gateway work is not fully wired into Expo config yet.
- The mobile deep-link scheme in `apps/mobile/app.config.ts` is `nextthing`. Some older config and docs still reference `focuslab://`; prefer the current scheme and document mismatches when touched.

## Testing Expectations

- Shared package: Vitest
- Web app: Vitest plus Playwright
- Mobile app: Jest / React Native Testing Library
- Edge Functions: Deno tests under `supabase/functions/_shared`

Use at least the relevant local checks for the area you touched:

- UI copy or docs only: no build required, but verify paths / commands / feature names against code.
- Shared logic: `npm run test --workspace=@focuslab/shared`
- Mobile behavior: `npm run test --workspace=@focuslab/mobile`
- Web behavior: `npm run test --workspace=@focuslab/web`
- Schema / Edge Function changes: `supabase db reset` and `npm run test:edge`

## Conventions

- TypeScript everywhere.
- Use Expo Router routes in `apps/mobile/app`, with screen implementations in `apps/mobile/src/screens`.
- Keep user-facing terminology aligned with the product:
  - `Journey` for daily progression
  - `Toolkit` for saved strategies
  - `App Disrupt` for the gateway / mindful-intercept feature
