# Implementation Notes

This repo is already built. Use this file as a lightweight execution checklist for ongoing work.

## Before Changing Code

1. Confirm whether the feature already exists in some form.
2. Check `.claude/architecture.md` and `.claude/documentation.md` for the current intended shape.
3. For mobile journey logic, inspect both:
   - `packages/shared/src/journey/progression.ts`
   - `supabase/functions/_shared/domain.ts`

## Change Categories

### Docs-only changes

- Verify commands, routes, feature names, and config paths against the repo.
- No code build is required, but do not leave historical or speculative statements in place.

### Shared logic changes

- Update `packages/shared`
- Update Deno mirrors if behavior is duplicated
- Run the relevant shared and Edge Function tests

### Mobile app changes

- Prefer route wrappers in `apps/mobile/app` and feature implementations in `apps/mobile/src/screens`
- If the change affects widget data, update JS and Swift contracts together
- If the change affects App Disrupt native behavior, note whether it also requires `app.config.ts` changes

### Web app changes

- Keep admin routes and role checks aligned
- Preserve the current split between landing page, auth, dashboard, and admin CMS

### Database / Supabase changes

- update migrations
- update seed if necessary
- regenerate `packages/shared/src/types/database.ts`

## Verification Levels

- Quick path:
  - `npm run lint`
  - `npm run typecheck`
- Full repo:
  - `npm run test`
  - `npm run test:ci`
- Schema / function path:
  - `supabase db reset`
  - `supabase functions serve --env-file .env.local`
- Surface-specific:
  - `npm run test --workspace=@focuslab/mobile`
  - `npm run test --workspace=@focuslab/web`
  - `npm run test --workspace=@focuslab/shared`

## Current Watchouts

1. Do not describe the widget as deferred. It is implemented.
2. Do not describe FamilyControls as only a future idea. Native files already exist.
3. Do not assume Community is a visible tab. It is currently hidden in the mobile tab bar.
4. Be explicit when mentioning `FocusLab` versus `Next Thing`.
