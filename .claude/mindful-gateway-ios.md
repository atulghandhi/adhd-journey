# App Disrupt / Mindful Gateway on iOS

This file reflects the current iOS gateway work in the repo.

## Current Product Shape

The codebase currently contains two related experiences:

### 1. Guided setup / shortcuts path

- `apps/mobile/src/screens/journey/MindfulGatewayTutorial.tsx`
- `apps/mobile/src/screens/disrupt/DisruptSetupScreen.tsx`

This path teaches the user how to create a manual shortcut / automation and uses the deep link:

- `nextthing://disrupt`

### 2. Richer App Disrupt path

- `apps/mobile/src/screens/disrupt/DisruptScreen.tsx`
- `apps/mobile/src/screens/gateway/GatewaySettingsScreen.tsx`
- `apps/mobile/src/screens/gateway/GatewayFirstRunFlow.tsx`
- `apps/mobile/src/screens/gateway/AppDisruptCard.tsx`
- `apps/mobile/src/stores/gatewayStore.ts`

This path adds:

- breathing pause with countdown
- escalating durations after open limits are exceeded
- free windows
- per-app open counts
- toolkit strategy reminders through `strategySnapshot`
- settings / onboarding UI for the feature

## Current Routes

- `/journey/mindful-gateway`
- `/disrupt-setup`
- `/disrupt`
- `/gateway-settings`

The journey screen also surfaces a CTA on Day 17:

- `Set up App Disrupt`

The Toolkit screen surfaces an `App Disrupt` card that links to gateway settings.

## Shared Logic

Gateway domain helpers already live in `packages/shared/src/types/domain.ts`, including:

- `DEFAULT_GATEWAY_CONFIG`
- `computeGatewayDuration`
- `isInFreeWindow`
- gateway config and snapshot types

There is test coverage in:

- `packages/shared/src/__tests__/gateway.test.ts`
- `apps/mobile/src/test/gatewayStore.test.ts`

## Native iOS Work Present In The Tree

The worktree now contains a FamilyControls implementation path:

- `apps/mobile/modules/family-controls-bridge`
- `apps/mobile/plugins/withFamilyControls`
- `apps/mobile/plugins/withFamilyControls/extensions/ShieldConfigExtension`
- `apps/mobile/plugins/withFamilyControls/extensions/DeviceActivityMonitorExtension`

The native bridge already exposes functions for:

- availability checks
- authorization request
- app picker presentation
- applying and removing shields
- starting and stopping doom-scroll monitoring

## FamilyControls Status

The `withFamilyControls` plugin is registered in `apps/mobile/app.config.ts` and fully wired.
Three extensions are built: **ShieldConfigExtension**, **ShieldActionExtension**, **DeviceActivityMonitorExtension**.

FamilyControls uses opaque `ApplicationToken`s — individual app names are not available to JS.
The UI therefore tracks aggregate opens via a single `"shielded_apps"` limit entry, while
the Shortcuts path continues to support per-app tracking with named `?app=` params.

## Current Behavior of `DisruptScreen`

`DisruptScreen.tsx` already handles:

- `nextthing://disrupt?app=<appId>`
- breathing phases
- countdown and phase labels
- free-window bypass
- escalating pause duration using open counts and limits
- today's task reminder
- toolkit strategy reminder when `strategySnapshot` is present

This is not just a plan document anymore. It describes code that already exists.

## Current Behavior of `GatewaySettingsScreen`

`GatewaySettingsScreen.tsx` currently exposes:

- feature enable toggle
- first-run onboarding via `?firstRun=true`
- app picker trigger when FamilyControls is available
- open limits editor
- free windows editor
- doom-scroll monitor hooks
- FamilyControls authorization state in the persisted store

## Platform Reality

- iOS has both the shortcuts path and the in-progress FamilyControls path.
- Android currently has the fallback tutorial messaging, not native parity.

## Recommended Next Steps

1. Enable `withFamilyControls` in `apps/mobile/app.config.ts`.
2. Run a native iOS build and verify the bridge and extensions end to end.
3. Confirm whether Day 17 should always route to gateway settings or still fall back to the simpler tutorial on older / unsupported platforms.
4. Decide how much of Community and Toolkit should feed into App Disrupt reminders beyond the current `strategySnapshot`.

## Documentation Rule

Do not document this feature as "future only" anymore.

The accurate description is:

- shortcuts-based setup exists
- app-side disrupt UI exists
- FamilyControls native implementation exists in the worktree
- Expo config wiring for the FamilyControls path is still pending
