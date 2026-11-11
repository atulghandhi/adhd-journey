# App Disrupt on iOS

App Disrupt puts a short breathing pause in front of the apps a user chooses.
This file describes how it works today and what iOS does and does not allow.

## What iOS allows

App Disrupt is built on Apple's Screen Time API (FamilyControls,
ManagedSettings, DeviceActivity). The constraints below shape the whole design.

- **A shield is a fixed template.** `ShieldConfiguration` takes an icon, a
  title, a subtitle and two buttons. There are no custom views, no animation
  and no live countdown. The text is only redrawn when the shield first appears
  or when a button handler answers `.defer`.
- **Shield buttons run in an extension.** Until iOS 26.5 that extension could
  only answer `.none`, `.close` or `.defer`. It could not open the app.
- **iOS 26.5 added `ShieldActionResponse.openParentalControlsApp`**, which opens
  the app that owns the shield. This is what makes a One Sec style flow possible
  without Shortcuts: the shield button opens Next Thing, which runs the animated
  pause and then lifts the shield.
- **Apps are opaque.** The app only ever holds `ApplicationToken`s. It can draw
  one with SwiftUI's `Label(token)` but cannot read its name. The shield
  configuration extension does receive the name and bundle id, and passes them
  along through the App Group.
- **iOS cannot open an arbitrary app.** After the pause, Next Thing can switch
  to apps with a known URL scheme (`src/lib/gateway.ts`). For anything else it
  lifts the shield and asks the user to swipe back.
- **DeviceActivity intervals are at least 15 minutes.** To bring a shield back
  after a shorter session, the schedule *starts* at the moment the shield is
  due and the monitor re-shields in `intervalDidStart`.

## The flow

1. The user opens a paused app. iOS shows our shield: "Pause before Instagram".
2. They tap **Take a breath**. What happens next depends on the pause style and
   the iOS version (`ShieldActionExtension.swift`):
   - **Guided, iOS 26.5+**: iOS opens Next Thing on the breathing screen.
   - **Guided, older iOS**: the extension posts a notification. Tapping it opens
     the breathing screen. The shield offers "Pause here instead" as a way out.
   - **Quick**, or whenever the hand-off does not happen: a timed pause on the
     shield itself. A second tap after it completes lifts the shield.
3. On the breathing screen (`DisruptScreen.tsx`) the countdown honours the
   pause length and progressive friction. "I don't need it" is available
   throughout. "Continue" appears when the countdown ends.
4. **Continue** lifts the shield for that one app for the session length (1, 5
   or 15 minutes), counts the open, and switches to the app.
5. When the session ends the shield returns, even mid-scroll, with a "Time's
   up" message.

"I don't need it" on the shield closes the app.

## Settings and where they are honoured

| Setting | Stored as | Honoured by |
| --- | --- | --- |
| Pause my apps (on/off) | `config.enabled` | `GatewayCore.applyShields` |
| Pause length (3/5/10/15s) | `config.breathDurationSeconds` | shield text, in-shield pause, breathing screen |
| Progressive friction (+1s per open) | `config.escalation.incrementPerOpenSeconds` | same three |
| Time per open (1/5/15 min) | `config.sessionMinutes` | `GatewayCore.beginSession` |
| Pause style (guided/quick) | `config.pauseStyle` | `ShieldActionExtension` |
| Check-ins after 10 / 30 min | `config.doomScroll` | daily DeviceActivity monitor |

The pause maths exists twice and must stay identical:
`computeShieldPauseSeconds` in `packages/shared` and
`GatewayCore.pauseSeconds(config:opensSoFar:)` in Swift.

## Code map

**Native, shared.** `modules/family-controls-bridge/src/GatewayCore.swift` holds
the App Group keys, the synced config, the pause maths, the open counter and
`applyShields`, the one function that decides what is shielded right now. It is
compiled into the app (through the pod) and copied into all three extensions by
the config plugin, so they cannot drift apart.

**Native, per target.**

- `FamilyControlsBridgeModule.swift`: the JS bridge. Authorization, app picker,
  `syncGateway`, `consumePendingShieldRequest`, `unlockForSession`.
- `plugins/withFamilyControls/extensions/ShieldConfigExtension`: shield text.
- `plugins/withFamilyControls/extensions/ShieldActionExtension`: shield buttons.
- `plugins/withFamilyControls/extensions/DeviceActivityMonitorExtension`:
  background re-shielding (session end, check-ins, start of day).

**Config plugin.** `plugins/withFamilyControls/withFamilyControls.js` adds the
entitlements and the three extension targets. It creates each target's Sources,
Frameworks and Resources phases and its file references by hand, because
node-xcode's `addTarget` creates an empty shell and `addSourceFile` then puts
the files into the main app's target instead. `app.config.ts` lists the same
targets for EAS Build signing.

**JS.**

- `modules/family-controls-bridge/index.ts`: typed wrapper over the bridge.
- `src/lib/gateway.ts`: `syncGatewayFromStore`, URL schemes.
- `src/hooks/useShieldDeepLink.ts`: picks up shield hand-offs and keeps native
  in step with the settings (launch, foreground, every settings change).
- `src/stores/gatewayStore.ts`: settings (persisted) plus live native status.
- `src/screens/disrupt/DisruptScreen.tsx`: the breathing screen.
- `src/screens/gateway/AppDisruptSettings.tsx`: the one settings UI, used by
  both `/gateway-settings` and `/journey/mindful-gateway`.

## Shared state (App Group `group.app.nextthing`)

All keys are declared in `GatewayKeys`. The ones worth knowing:

- `gateway_config_v2`: JSON settings written by `syncGateway`.
- `shielded_app_tokens`, `shielded_category_tokens`: the selection.
- `gateway_unlock_until`: when the current session ends.
- `gateway_target_*`: the app the user was opening, so only it is unlocked.
- `gateway_pending_at`, `gateway_handoff_at`: a hand-off waiting for the app.
- `gateway_breath_until`: an in-shield pause in progress.
- `gateway_opens_count`, `gateway_opens_day`: today's opens.

## The Shortcuts path

`/disrupt-setup` still teaches the manual Shortcuts automation
(`nextthing://disrupt?app=<name>`) for devices without Screen Time shields.
`DisruptScreen` serves it with the same pause settings.

## Testing

Screen Time APIs do not run in the simulator in any useful way, and none of
this can be exercised without a native build on a real device.

```bash
cd apps/mobile
npx expo prebuild --platform ios --clean
```

Then build from Xcode onto a device. Things to check, in order:

1. Each extension target lists its Swift files under Build Phases.
2. A paused app shows the Next Thing shield, not iOS's stock one.
3. "Take a breath" opens Next Thing (iOS 26.5+).
4. "Continue" opens the app, and the shield returns after the session.

`debugFamilyControlsState()` returns a one-line summary of native state.

What is covered without a device: the pause maths and config mapping
(`packages/shared/src/__tests__/gateway.test.ts`), the store
(`apps/mobile/src/test/gatewayStore.test.ts`) and URL schemes
(`apps/mobile/src/test/gateway.test.ts`).

## Known limits

- Distribution builds need Apple's Family Controls entitlement approved for
  the app and for each of the three extension bundle ids.
- `openParentalControlsApp` is built from its raw value (3) so the code also
  compiles against SDKs older than 26.5.
- An app paused through a whole *category* unlocks that category for the
  session, because iOS only tells the button handler which category it was.
- Android has no equivalent yet.
