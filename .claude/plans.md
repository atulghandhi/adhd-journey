# Current Roadmap

The repository is past the original greenfield milestone plan. This file now tracks the current iteration of the product and the highest-value follow-up work.

## Current State

- Core journey loop is implemented across mobile, web, shared logic, and Supabase.
- Toolkit retention flow is implemented and surfaced in the mobile Toolkit screen.
- Today Task widget is implemented for iOS.
- App Disrupt has a working app-side foundation and native FamilyControls files in the worktree.
- Admin CMS is implemented.

## Active Priorities

### 1. Finish native App Disrupt wiring

Current status:

- `gatewayStore`, settings UI, disrupt screen, shared duration helpers, and tests exist
- `family-controls-bridge` and `withFamilyControls` exist
- shield and device-activity extension sources exist

Still needed:

- enable `withFamilyControls` in `apps/mobile/app.config.ts`
- verify the native flow in an iOS dev build
- decide how Android should be documented and surfaced long-term

### 2. Clean up naming and deep-link consistency

Current status:

- brand is `Next Thing`
- repo namespace is `FocusLab`
- app scheme is `nextthing`

Still needed:

- reconcile lingering `focuslab://auth/callback` references
- keep docs explicit whenever code and product naming differ

### 3. Harden notifications for production

Current status:

- notification selection logic exists
- device push registration exists
- Resend and FCM stubs exist

Still needed:

- confirm the final push token / delivery path
- verify delivery end to end with real credentials

### 4. Decide whether Community stays hidden or returns to the tab bar

Current status:

- community screens and tables exist
- the route exists in Expo Router
- the tab is hidden from the mobile tab bar

Still needed:

- a product decision on whether to re-expose Community or keep it secondary

## Verification Checklist

Use the smallest relevant set for the area you changed:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:ci`
- `supabase db reset`
- `supabase functions serve --env-file .env.local`

Targeted checks:

- mobile only: `npm run test --workspace=@focuslab/mobile`
- web only: `npm run test --workspace=@focuslab/web`
- shared only: `npm run test --workspace=@focuslab/shared`

## Notes

- Do not assume the repo is empty or needs scaffolding. It is already a working monorepo.
- Do not document widgets as deferred. The Today Task widget is real code.
- Do not document FamilyControls as purely hypothetical. The native bridge, plugin, and extensions are already in the tree, even though Expo config wiring is not finished.
