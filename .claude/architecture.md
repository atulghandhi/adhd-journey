# FocusLab / Next Thing Architecture

This document describes the current codebase, not the original greenfield plan.

## Naming

- Codebase namespace: `FocusLab`
- User-facing brand: `Next Thing`
- Repo and package names still use `focuslab`

## Stack

| Layer | Current implementation |
| --- | --- |
| Mobile | Expo 55, React Native 0.83, Expo Router, NativeWind, Zustand, TanStack Query |
| Web | Next.js 16 App Router, Tailwind CSS, React 19 |
| Backend | Supabase Postgres, Auth, Edge Functions, RLS |
| Shared logic | `packages/shared` for progression, notifications, quiz, timezone, gateway helpers, types |
| Payments | RevenueCat wrapper on mobile plus `verify-payment` Edge Function |
| Email | Resend sender in `supabase/functions/_shared/external.ts` |
| Push | `expo-notifications` on device, FCM sender stub on the server |
| Native iOS extras | WidgetKit Today Task widget, widget bridge, FamilyControls bridge/extensions in progress |
| Testing | Vitest, Jest, Playwright, Deno tests |

## High-Level Topology

```text
Mobile app (Expo)            Web app (Next.js)
        \                        /
         \                      /
          +---- Supabase -------+
                 |  |  |
                 |  |  +-- Edge Functions
                 |  +----- Auth / Postgres / RLS
                 +-------- Seeded content and admin-managed content
```

## Mobile Architecture

### Route surface

- `app/index.tsx` bootstraps auth-aware entry
- `app/(tabs)/journey.tsx`
- `app/(tabs)/progress.tsx` with label `Toolkit`
- `app/(tabs)/account.tsx`
- `app/(tabs)/community.tsx` exists but is currently hidden from the tab bar
- `app/payment/paywall.tsx`
- `app/completion/*`
- `app/disrupt.tsx`
- `app/disrupt-setup.tsx`
- `app/gateway-settings.tsx`
- `app/journey/mindful-gateway.tsx`

### Providers

`apps/mobile/src/providers/AppProviders.tsx` wires:

- TanStack Query
- auth session management
- theme preference handling
- toast system
- offline check-in replay
- widget sync

### Core feature modules

- Journey progression: `useJourneyState`, `TaskRenderer`, `CheckInSheet`, `StuckSheet`
- Toolkit: `useToolkit`, `toolkit_items` table, `ProgressScreen`
- App Disrupt: `gatewayStore`, `DisruptScreen`, `GatewaySettingsScreen`, `GatewayFirstRunFlow`
- Account: theme, notifications, push registration, restart journey, delete account

## Web Architecture

### Public surface

- Landing page at `/`
- Auth routes under `/auth/*`
- Authenticated dashboard at `/dashboard`

### Admin surface

- `/admin/tasks`
- `/admin/templates`
- `/admin/settings`
- `/admin/rewards`
- `/admin/moderation`
- `/admin/analytics`

Admin access is enforced in `apps/web/src/app/admin/layout.tsx` using the authenticated profile role.

## Shared Logic

`packages/shared` is the main logic package for:

- journey progression and restart payload generation
- spaced repetition
- notification selection logic
- quiz helpers
- timezone helpers
- gateway configuration and duration helpers
- app-level domain types built on generated Supabase types

Important: Edge Functions cannot import the workspace package directly, so `supabase/functions/_shared/domain.ts` mirrors key logic. Keep both sides aligned when behavior changes.

## Backend Surface

### Main tables

- `profiles`
- `tasks`
- `user_progress`
- `check_ins`
- `spaced_repetition_state`
- `toolkit_items`
- `community_posts`
- `community_reactions`
- `community_replies`
- `community_reports`
- `notification_templates`
- `notification_log`
- `push_tokens`
- `quiz_questions`
- `reward_resources`
- `spaced_repetition_config`

### Journey model

- `tasks` are seeded content plus admin-editable metadata
- `user_progress` tracks the current journey instance via `journey_id`
- `check_ins` record completion, review, and skip behavior
- `spaced_repetition_state` drives review resurfacing
- `profiles.current_journey_id` identifies the active run
- `DEFAULT_JOURNEY_ID` still anchors the default task set

### Toolkit model

- `toolkit_items` stores the user’s keep / maybe_later / not_for_me decisions
- The Toolkit screen groups items by status and maps them back to journey tasks
- `gatewayStore.strategySnapshot` is a client-side summary for App Disrupt surfacing

### Admin-managed content

- tasks
- notification templates
- spaced repetition config
- reward resources

## Edge Functions

- `get-journey-state`: loads tasks, initializes progress if missing, computes current state, and persists derived progress changes
- `complete-check-in`: validates a completion check-in and advances journey state
- `daily-reviews`: computes review scheduling
- `daily-notifications`: picks one channel / template per user and records notification history
- `verify-payment`: updates `profiles.payment_status` and stores receipt payload
- `admin-analytics`: powers the analytics dashboard
- `delete-account`: removes the authenticated user
- `health`: simple runtime check

## Notifications

Current code path:

- mobile requests notification permission with `expo-notifications`
- mobile stores a push token in `push_tokens`
- `daily-notifications` loads the latest push token or falls back to email
- push and email sends are wrapped in stub-friendly helpers in `_shared/external.ts`

Current caveat:

- the mobile client stores the token returned by `expo-notifications`
- the server sender currently posts directly to the legacy FCM endpoint using `FCM_SERVER_KEY`
- verify the token format and final delivery path before treating push as production-ready

## Payments

- Mobile paywall uses `apps/mobile/src/lib/revenuecat.ts`
- When the RevenueCat public key is missing, the app stays in stub / dev-bypass mode
- `verify-payment` accepts either direct `payment_status` input or webhook-style RevenueCat event payloads

## Native iOS

### Today Task widget

Implemented and wired in `apps/mobile/app.config.ts` through `./plugins/withTodayTaskWidget/withTodayTaskWidget`.

Pieces:

- WidgetKit Swift extension in `apps/mobile/plugins/withTodayTaskWidget/swift`
- Expo module bridge in `apps/mobile/modules/widget-data-bridge`
- sync hook in `apps/mobile/src/hooks/useWidgetSync.ts`
- App Group ID `group.app.nextthing`

### FamilyControls / App Disrupt native path

Present in the worktree:

- `apps/mobile/modules/family-controls-bridge`
- `apps/mobile/plugins/withFamilyControls`
- `ShieldConfigExtension`
- `DeviceActivityMonitorExtension`

Current caveat:

- this native path is not yet enabled in `apps/mobile/app.config.ts`
- the JS screens and store already assume the bridge exists when available

## Timezone and Progression Rules

The codebase treats timezone handling as core behavior:

- user timezone lives in `profiles.notification_preferences.timezone`
- daily progression, streaks, and quiet hours are timezone-aware
- offline check-ins preserve the client-side timestamp for later replay

Primary logic lives in:

- `packages/shared/src/journey/progression.ts`
- `packages/shared/src/timezone.ts`
- mirrored Edge Function helpers in `supabase/functions/_shared/domain.ts`

## Environment

Use `.env.example` as the current source of truth. Key groups are:

- Supabase URL / anon / service role
- Expo-public Supabase values
- `FCM_SERVER_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY`
- `REVENUECAT_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`

## Current Caveats To Keep Visible

1. Product naming is mixed: repo uses `focuslab`, app brand uses `Next Thing`.
2. FamilyControls code exists, but the config plugin is not yet enabled in `app.config.ts`.
3. The mobile app scheme is `nextthing`, while some older config still references `focuslab://auth/callback`.
4. Push delivery should be revisited before production because token registration and server delivery are not yet clearly aligned.
