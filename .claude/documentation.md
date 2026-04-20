# FocusLab / Next Thing Documentation

This file is the current-state runbook for the repo.

## What Exists Today

### Mobile app

- Email/password auth with confirmation flow
- Onboarding screens for welcome, name, focus area, and motivation
- Journey screen with interactive task renderer, check-ins, skips, and review cards
- Toolkit screen with saved strategies, recent activity, journey map, and `App Disrupt` card
- Account screen with theme, notification preferences, push registration, billing entry point, restart journey, and delete account
- Completion flow with congrats, quiz, and resources
- Paywall flow backed by RevenueCat wrapper and `verify-payment`

### Web app

- Landing page
- Auth pages
- Authenticated dashboard
- Admin CMS for tasks, templates, settings, rewards, moderation, and analytics

### Supabase

- SQL migrations through `00008_toolkit_items.sql`
- seed data for tasks, quiz questions, notification templates, spaced repetition config, and reward resources
- Edge Functions for journey state, check-ins, notifications, reviews, analytics, payments, health, and account deletion

### Native iOS extras

- Today Task widget is implemented
- FamilyControls bridge / extensions are present in the worktree but not yet enabled in Expo config

## Local Setup

### Prerequisites

- Node.js 20+
- npm 11+
- Supabase CLI
- Docker Desktop for `supabase start`
- Xcode if you need iOS native builds

### First-time bootstrap

```bash
npm install
cp .env.example .env.local
supabase start
supabase db reset
supabase gen types typescript --local > packages/shared/src/types/database.ts
npm run mobile:env:sync
npm run dev
```

## Common Commands

### Quality

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:ci`

### Database and functions

- `supabase start`
- `supabase db reset`
- `supabase functions serve --env-file .env.local`
- `npm run db:types`

### App-specific

- `npm run dev --workspace=@focuslab/mobile`
- `npm run dev --workspace=@focuslab/web`
- `npm run test --workspace=@focuslab/mobile`
- `npm run test --workspace=@focuslab/web`
- `npm run test:e2e --workspace=@focuslab/web`

## Route and Feature Map

### Mobile routes

- `/auth/login`
- `/auth/register`
- `/auth/confirm-email`
- `/auth/forgot-password`
- `/onboarding/welcome`
- `/onboarding/name`
- `/onboarding/focus-area`
- `/onboarding/motivation`
- `/(tabs)/journey`
- `/(tabs)/progress` with tab title `Toolkit`
- `/(tabs)/account`
- `/payment/paywall`
- `/completion/congrats`
- `/completion/quiz`
- `/completion/resources`
- `/journey/mindful-gateway`
- `/disrupt-setup`
- `/disrupt`
- `/gateway-settings`

Note: `/(tabs)/community` exists, but the tab is currently hidden.

### Web routes

- `/`
- `/auth/login`
- `/auth/register`
- `/auth/confirm`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/dashboard`
- `/admin/*`

## iOS Widget

The Today Task widget is already in the repo.

Key files:

- `apps/mobile/plugins/withTodayTaskWidget/withTodayTaskWidget.js`
- `apps/mobile/plugins/withTodayTaskWidget/swift/*`
- `apps/mobile/modules/widget-data-bridge/*`
- `apps/mobile/src/hooks/useWidgetSync.ts`

Data contract written by the app:

- `streakCount`
- `completedCount`
- `totalTasks`
- `currentTaskTitle`
- `currentTaskDay`
- `currentTaskDescription`
- `todayTaskCompleted`
- `lastUpdated`

App Group details:

- group: `group.app.nextthing`
- `UserDefaults` key: `widget_data`

Build reminder:

- widgets do not work in Expo Go
- use a native iOS dev build after `expo prebuild`

## App Disrupt / Gateway

Current user-visible paths:

- `MindfulGatewayTutorial` under `/journey/mindful-gateway`
- `DisruptSetupScreen` under `/disrupt-setup`
- `DisruptScreen` under `/disrupt`
- `GatewaySettingsScreen` under `/gateway-settings`
- `AppDisruptCard` on the Toolkit screen

Current implementation pieces:

- `gatewayStore` persists config, counts, and strategy snapshot
- shared helpers compute pause duration, free-window behavior, and open-limit logic
- native FamilyControls bridge / extensions are in the repo

Important caveat:

- `apps/mobile/app.config.ts` does not yet enable `./plugins/withFamilyControls/withFamilyControls`
- treat FamilyControls as in-progress native wiring, not fully active Expo config

## Current Operational Caveats

1. Repo and package naming still say `FocusLab`, but product copy says `Next Thing`.
2. The mobile app scheme is `nextthing`; older config still mentions `focuslab://auth/callback`.
3. Push delivery should be validated before production because device registration uses `expo-notifications`, while the server sender still targets the FCM endpoint directly.
4. Local Supabase Edge runtime may still require the certificate-trust workaround script in restricted environments:
   - `scripts/build-edge-runtime-with-local-ca.sh`

## What To Update When Code Changes

- Schema change: update migrations, seed if needed, regenerate `packages/shared/src/types/database.ts`
- Shared business logic change: update `packages/shared` and the Deno mirror in `supabase/functions/_shared/domain.ts`
- Widget payload change: update both `useWidgetSync.ts` and `WidgetData.swift`
- Gateway native change: keep `GatewaySettingsScreen`, `gatewayStore`, and the native bridge / plugin docs aligned
