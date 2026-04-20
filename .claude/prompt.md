You are working in an existing production-oriented monorepo for an ADHD support product.

## Product

- User-facing brand: `Next Thing`
- Repo / package namespace: `FocusLab`
- Mobile-first ADHD journey app with a supporting web dashboard and admin CMS

## What already exists

- Mobile auth, onboarding, journey progression, check-ins, spaced repetition, toolkit, paywall, completion flow, account settings
- Web landing page, auth flows, user dashboard, admin CMS
- Supabase migrations, seed data, RLS, and Edge Functions
- iOS Today Task widget
- App Disrupt / gateway flow with FamilyControls-related native files in progress

## How to approach changes

1. Treat the current codebase as the source of truth, not the old greenfield build spec.
2. Read the relevant docs in `.claude/` before making structural changes:
   - `architecture.md`
   - `documentation.md`
   - `plans.md`
   - `ios-widgets.md`
   - `mindful-gateway-ios.md`
3. Keep naming explicit:
   - `FocusLab` for repo / package namespace
   - `Next Thing` for user-facing copy
4. If you change shared business logic, keep the Edge Function mirror in `supabase/functions/_shared/domain.ts` aligned.
5. If you change widget payloads, update both the JS sync hook and the Swift widget contract.
6. If you touch App Disrupt native work, document whether the change is:
   - app-side only
   - native files only
   - fully wired into `app.config.ts`

## Current caveats to remember

- Community exists in code but is hidden from the mobile tab bar.
- FamilyControls files exist, but `withFamilyControls` is not yet enabled in `apps/mobile/app.config.ts`.
- The mobile app scheme is `nextthing`; older config still references `focuslab://auth/callback`.
- Push notifications need production-path verification because token registration and server delivery are not yet clearly finalized.

## Validation

Run the smallest relevant checks for the surface you changed:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `supabase db reset`
- `supabase functions serve --env-file .env.local`

When docs change, verify feature names, routes, and commands directly against the code instead of copying historical milestone language.
