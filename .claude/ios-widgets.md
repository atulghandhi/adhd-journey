# iOS Widgets

This file describes the widget code that already exists in the repo and the follow-up work around it.

## Current Status

Implemented:

- a real WidgetKit extension for iOS
- a custom Expo config plugin that injects the widget target during prebuild
- a native Expo module bridge for writing shared widget data
- a React hook that syncs journey state into the widget payload

Not implemented:

- Android widget parity
- interactive widgets
- toolkit-specific or App Disrupt-specific widget variants

## Current Widget

The shipped widget is `Today's Task`.

It reads shared data written by the React Native app and shows:

- current day / task title
- short task description
- completion state for today
- streak count

Supported families in `TodayTaskWidget.swift`:

- `systemSmall`
- `systemMedium`
- `accessoryRectangular`
- `accessoryInline`

## File Map

- Config plugin:
  - `apps/mobile/plugins/withTodayTaskWidget/withTodayTaskWidget.js`
- Swift widget sources:
  - `apps/mobile/plugins/withTodayTaskWidget/swift/TodayTaskWidgetBundle.swift`
  - `apps/mobile/plugins/withTodayTaskWidget/swift/TodayTaskWidget.swift`
  - `apps/mobile/plugins/withTodayTaskWidget/swift/WidgetData.swift`
- Native bridge:
  - `apps/mobile/modules/widget-data-bridge/index.ts`
  - `apps/mobile/modules/widget-data-bridge/ios/WidgetDataBridgeModule.swift`
- Sync hook:
  - `apps/mobile/src/hooks/useWidgetSync.ts`
- Provider wiring:
  - `apps/mobile/src/providers/AppProviders.tsx`

## Data Contract

The app writes a JSON payload with these fields:

- `streakCount`
- `completedCount`
- `totalTasks`
- `currentTaskTitle`
- `currentTaskDay`
- `currentTaskDescription`
- `todayTaskCompleted`
- `lastUpdated`

The Swift side decodes the same contract in `WidgetData.swift`.

## Storage and Entitlements

- App Group: `group.app.nextthing`
- Shared `UserDefaults` key: `widget_data`

The bridge writes to shared `UserDefaults` and then calls `WidgetCenter.shared.reloadAllTimelines()`.

## Build and Test

Widgets require a native iOS build.

```bash
cd apps/mobile
npx expo prebuild --platform ios --clean
```

Then:

1. open the generated `ios/*.xcworkspace` in Xcode
2. build and run the main app
3. add the widget from the iOS widget picker
4. complete a check-in or foreground the app
5. confirm the widget refreshes

## Known Constraints

- Widgets do not work in Expo Go.
- The widget is iOS-only.
- The widget does not fetch network data on its own.
- All widget data is precomputed by the app and synced through shared storage.

## Current Follow-up Ideas

These are possible next steps, not shipped features:

1. Toolkit widget that surfaces a saved strategy from the user's toolkit.
2. App Disrupt stats widget backed by `gatewayStore` or future shared storage.
3. Live Activity support once the FamilyControls path is fully wired and validated.
4. Android widget parity if mobile product direction justifies it.

## Keep In Sync

Whenever widget behavior changes, update all of:

- `useWidgetSync.ts`
- `WidgetData.swift`
- `TodayTaskWidget.swift`
- `withTodayTaskWidget.js` if target / entitlement setup changes
