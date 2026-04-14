# Mindful Gateway — iOS Implementation Plan

## Overview

The Mindful Gateway intercepts the user's attempt to open distracting apps (Instagram, TikTok, YouTube, Twitter, games) and inserts a breathing pause + toolkit strategy reminder before allowing access. It also monitors ongoing usage and re-interrupts after configurable time thresholds (the "Doom Scroll Emergency Brake").

This document covers V1 (Shortcuts-based), V1.5 (FamilyControls-based), and V2 (novelty interventions). **iOS only.**

---

## Architecture Decision: Two Possible iOS Approaches

### Approach A: iOS Shortcuts Automation (V1)

**How it works:**
1. User creates an iOS Shortcut automation: "When I open Instagram → Open URL `nextthing://gateway?app=instagram`"
2. Our app launches to the GatewayScreen via deep link
3. Breathing animation + haptics + toolkit strategy plays
4. User taps "Continue to Instagram" (we open the URL scheme `instagram://`) or "Go back"

**Pros:**
- No Apple entitlement approval needed
- Works with any app
- Shipping in weeks, not months
- No native Swift code required for the core flow

**Cons:**
- Requires manual setup per app (we guide with a tutorial, but still friction)
- User can disable automations at any time
- iOS may show "Run automation?" confirmation dialog (varies by iOS version)
- **Cannot monitor usage time** — no doom-scroll brake possible
- Cannot enforce schedules — only suggest them

### Approach B: FamilyControls / Screen Time API (V1.5)

**How it works:**
1. App requests `FamilyControls` authorization (no parental account needed — "Individual" authorization since iOS 16)
2. User picks apps to shield via `FamilyActivityPicker` (Apple's native app picker)
3. `DeviceActivityMonitor` extension runs in background, applies shields on schedule
4. `ShieldConfigurationExtension` provides custom shield appearance
5. Shield's action button opens our app → GatewayScreen
6. After breathing pause, we temporarily lift the shield via `ManagedSettings`
7. `DeviceActivityMonitor` tracks usage time → re-shields at 10min/30min thresholds

**Pros:**
- **Seamless UX — no manual Shortcuts setup. Fully automatic.**
- Enforced shields — user can't easily bypass
- Usage time monitoring enables doom-scroll brake
- Schedule-based shielding (9am–5pm work mode, etc.)
- Apple explicitly supports "Individual" (non-parental) use since iOS 16

### Can FamilyControls bypass Shortcuts entirely? YES.

This is the whole point of V1.5. With FamilyControls:
- **Zero user setup.** No Shortcuts, no automations, no tutorials.
- The user taps one button ("Enable Mindful Gateway"), iOS shows a system prompt ("Allow Next Thing to manage Screen Time?"), user taps Allow.
- Then a native `FamilyActivityPicker` (Apple's pre-built SwiftUI component) shows all installed apps. User checks the boxes for their distracting apps. Done.
- From that moment, those apps are shielded automatically. No Shortcuts to configure, no automations to break.
- This is why we want the FamilyControls entitlement ASAP — it makes the entire setup **one tap + pick apps**, which is the ADHD-friendly "effortless admin" experience.

**The V1 Shortcuts approach exists only as a bridge** while we wait for Apple to approve the entitlement (1-5 business days, but sometimes longer). Once V1.5 ships, the Shortcuts tutorial becomes a fallback for users on iOS 15 or below.

**Cons:**
- Requires `com.apple.developer.family-controls` entitlement (request via Apple developer portal — typically approved for wellbeing apps)
- Shield extensions have severe limits: 6MB memory, no network, limited UI (SwiftUI Label/Button only)
- Cannot render custom animations inside the shield itself — must redirect to main app
- Requires native Swift code for 3 app extensions
- Only iOS 16+
- Longer development timeline (4-6 weeks vs 1-2 for Shortcuts)

### Recommendation

**Ship V1 with Shortcuts** (fast, zero Apple approval, validates the concept), then **upgrade to V1.5 with FamilyControls** once the entitlement is approved and user data confirms the feature is valued.

---

## V1: Shortcuts-Based Implementation

### What Needs Native Swift Code?

**Yes — one native module for haptics:**

`expo-haptics` only exposes three fire-and-forget patterns: `impact`, `notification`, `selection`. For the breathing circle, we need **continuous rhythmic haptic patterns** synced to the animation — a heartbeat-like pulse that ramps up during inhale and softens during exhale. This requires `CoreHaptics` (`CHHapticEngine`), which is Swift-only.

Everything else stays in React Native:
- Breathing circle animation → `react-native-reanimated`
- Strategy card rendering → standard RN components
- Deep link handling → `expo-router` linking
- Timer/scheduling logic → JS
- SR strategy selection → existing algorithm in `packages/shared`

### File Structure

```
apps/mobile/
├── ios/
│   └── NativeModules/
│       └── BreathingHaptics/
│           ├── BreathingHapticsModule.swift      # CHHapticEngine pattern player
│           └── BreathingHapticsModule.m          # ObjC bridge header
│
├── src/
│   ├── screens/gateway/
│   │   ├── GatewayScreen.tsx                     # Full-screen overlay controller
│   │   ├── BreathingCircle.tsx                   # Animated expanding/contracting circle
│   │   └── StrategyReminder.tsx                  # Toolkit strategy card shown post-breathe
│   │
│   ├── hooks/
│   │   ├── useBreathingCycle.ts                  # Manages inhale/exhale timing + haptic sync
│   │   └── useGatewayStrategy.ts                 # SR-based toolkit strategy picker
│   │
│   └── native/
│       └── breathingHaptics.ts                   # JS bridge to BreathingHapticsModule
│
├── app/
│   └── gateway.tsx                               # Deep link route: nextthing://gateway
```

### Deep Link Flow

```
User taps Instagram
  → iOS Shortcut fires: "Open URL nextthing://gateway?app=instagram"
  → Expo Router matches /gateway route
  → GatewayScreen mounts
    → Breathing animation starts (5 seconds default)
    → Haptic engine plays synchronized heartbeat pattern
    → After breathe: strategy card fades in from toolkit
    → User reads strategy (2-3 seconds)
    → Two buttons: "Continue to Instagram" | "Go back"
      → Continue: Linking.openURL("instagram://")
      → Go back: router.back() or router.push("/(tabs)/journey")
```

### BreathingHapticsModule (Swift)

```swift
// Simplified — full implementation in code
import CoreHaptics

@objc(BreathingHapticsModule)
class BreathingHapticsModule: NSObject {
    private var engine: CHHapticEngine?

    @objc func playBreathingPattern(
        _ durationSeconds: Double,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            resolver(nil)
            return
        }

        do {
            engine = try CHHapticEngine()
            try engine?.start()

            // Build a pattern: ramp intensity up (inhale), hold, ramp down (exhale)
            // Each cycle = ~4 seconds (2s inhale + 2s exhale)
            let cycles = Int(durationSeconds / 4.0)
            var events: [CHHapticEvent] = []

            for cycle in 0..<cycles {
                let offset = Double(cycle) * 4.0

                // Inhale: 4 gentle pulses, increasing intensity
                for i in 0..<4 {
                    let time = offset + Double(i) * 0.5
                    let intensity = Float(i + 1) * 0.2
                    events.append(CHHapticEvent(
                        eventType: .hapticTransient,
                        parameters: [
                            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
                        ],
                        relativeTime: time
                    ))
                }

                // Exhale: 4 gentle pulses, decreasing intensity
                for i in 0..<4 {
                    let time = offset + 2.0 + Double(i) * 0.5
                    let intensity = Float(4 - i) * 0.15
                    events.append(CHHapticEvent(
                        eventType: .hapticTransient,
                        parameters: [
                            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
                        ],
                        relativeTime: time
                    ))
                }
            }

            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine?.makePlayer(with: pattern)
            try player?.start(atTime: CHHapticTimeImmediate)

            resolver(nil)
        } catch {
            rejecter("HAPTIC_ERROR", error.localizedDescription, error)
        }
    }

    @objc func stop() {
        engine?.stop()
        engine = nil
    }
}
```

### BreathingCircle Animation (Reanimated)

The circle alternates between `scale(0.4)` (exhale) and `scale(1.0)` (inhale) using `withRepeat(withSequence(...))`:

```tsx
// Simplified concept
const scale = useSharedValue(0.4);
const opacity = useSharedValue(0.6);

useEffect(() => {
  scale.value = withRepeat(
    withSequence(
      withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),  // inhale
      withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),  // exhale
    ),
    -1, // infinite
  );
  opacity.value = withRepeat(
    withSequence(
      withTiming(1.0, { duration: 2000 }),
      withTiming(0.6, { duration: 2000 }),
    ),
    -1,
  );
}, []);
```

The animation runs on Reanimated's UI thread (native driver) — zero JS thread involvement, buttery smooth even under load.

### Strategy Resurfacing via SR Algorithm

**How we pick which toolkit strategy to show:**

```ts
// useGatewayStrategy.ts
function useGatewayStrategy() {
  const { keepItems } = useToolkit();
  const srStates = useSRStates(); // fetch spaced_repetition_state for user

  // Find toolkit items whose SR state says they're "due" for review
  const today = getDateKeyInTimeZone(new Date().toISOString(), timezone);

  const dueStrategies = keepItems
    .map((item) => {
      const srState = srStates.find((sr) => sr.task_id === item.task_id);
      return { item, srState, overdueDays: srState
        ? differenceInCalendarDays(today, srState.next_review_date, timezone)
        : 999 // never reviewed = most overdue
      };
    })
    .filter((s) => s.overdueDays >= 0) // only show if due or overdue
    .sort((a, b) => b.overdueDays - a.overdueDays); // most overdue first

  // Return top strategy, or random from top 3 for novelty
  if (dueStrategies.length === 0) return null;
  const top3 = dueStrategies.slice(0, 3);
  return top3[Math.floor(Math.random() * top3.length)];
}
```

After the user sees the strategy during the gateway, we fire a lightweight SR update:
```ts
// Mark as "reviewed" — the SR algorithm will push next_review_date further out
upsertSRState({ taskId: strategy.task_id, userRating: 3, triedIt: true });
```

This is a single Supabase upsert — no server function needed. The client writes directly to `spaced_repetition_state` (RLS allows user to update own rows).

### Tutorial Screen Upgrade

The existing `MindfulGatewayTutorial.tsx` currently shows 4 generic text steps. For V1, upgrade it to:

1. **Step-by-step visual guide** with screenshots for each iOS Shortcut step
2. **App picker**: Let user select which apps to gate (store in local AsyncStorage + Supabase profile)
3. **Deep link test**: Button that creates a test shortcut URL and verifies the round-trip works
4. **Schedule config**: Optional "free hours" time picker (e.g., 5pm–8pm = no interruption)

### Schedule / "Reward Windows" (V1)

Store in user profile or local AsyncStorage:
```ts
interface GatewaySchedule {
  enabled: boolean;
  freeWindows: { start: string; end: string }[]; // e.g., [{ start: "17:00", end: "20:00" }]
  breathDurationSeconds: number; // default 5
}
```

When GatewayScreen mounts, check:
```ts
const now = new Date();
const currentTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
const inFreeWindow = schedule.freeWindows.some(w => currentTime >= w.start && currentTime <= w.end);

if (inFreeWindow) {
  // Skip breathing, immediately redirect to target app
  Linking.openURL(targetAppUrl);
  return;
}
```

**Why include this in V1:** It's pure JS logic, zero native work, and provides the "reward" mechanism for ADHD brains — "if I just focus until 5pm, the apps will open without friction." This leverages temporal discounting in a helpful direction.

---

## V1.5: FamilyControls Implementation

### Apple Entitlement

Request `com.apple.developer.family-controls` via the Apple Developer portal. For a wellbeing/ADHD app, this is routinely approved. The request form asks:
- What apps will be shielded (user-selected distracting apps)
- Why (ADHD self-management, mindful app usage)
- How users can remove shields (always available in app settings)

Timeline: 1–5 business days for approval.

### Required App Extensions (all Swift)

```
apps/mobile/
├── ios/
│   ├── ShieldConfigExtension/              # Custom shield appearance
│   │   ├── ShieldConfigExtension.swift     # ShieldConfigurationDataSource
│   │   ├── Info.plist
│   │   └── ShieldConfigExtension.entitlements
│   │
│   ├── DeviceActivityMonitorExtension/     # Usage monitoring + doom-scroll brake
│   │   ├── DeviceActivityMonitorExtension.swift
│   │   ├── Info.plist
│   │   └── DeviceActivityMonitorExtension.entitlements
│   │
│   ├── AppGroupData/                       # Shared data container
│   │   └── SharedDefaults.swift            # UserDefaults(suiteName: "group.app.nextthing")
│   │
│   └── NativeModules/
│       ├── BreathingHaptics/               # (from V1)
│       └── FamilyControlsBridge/
│           ├── FamilyControlsModule.swift  # Authorization, app selection, shield management
│           └── FamilyControlsModule.m
```

### How FamilyControls Works (Step by Step)

```
1. App calls AuthorizationCenter.shared.requestAuthorization(for: .individual)
   → iOS shows system prompt: "Allow Next Thing to manage your Screen Time?"

2. User picks apps via FamilyActivityPicker (SwiftUI, presented from RN via native module)
   → Returns Set<ApplicationToken> (opaque tokens, no app names for privacy)

3. App stores tokens + creates a ManagedSettingsStore
   → store.shield.applications = selectedTokens
   → iOS immediately shows shields over those app icons

4. User taps shielded app → ShieldConfigExtension provides custom label/buttons
   → Primary button: "Take a breath" → opens nextthing://gateway
   → Secondary button: "Not now" → dismisses shield temporarily

5. GatewayScreen plays breathing + strategy (same as V1)

6. After breathing, app temporarily removes shield for the target app:
   → store.shield.applications.remove(token)
   → Start DeviceActivityMonitor schedule for time-based re-shielding

7. DeviceActivityMonitor fires at 10min threshold:
   → Re-applies shield → user sees breathing screen again
   → After breathing, removes shield, starts 30min timer
   → At 30min: final shield + "You've been scrolling for 40 minutes total"
```

### The Doom Scroll Emergency Brake

```swift
// DeviceActivityMonitorExtension.swift
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    let store = ManagedSettingsStore()

    // Called when the user hits a usage threshold
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        // Re-apply shield to force the user back through breathing
        let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
        if let tokenData = sharedDefaults?.data(forKey: "shielded_apps"),
           let tokens = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: tokenData) {
            store.shield.applications = tokens
        }

        // Increment session counter for escalating messages
        let sessionCount = (sharedDefaults?.integer(forKey: "doom_scroll_count") ?? 0) + 1
        sharedDefaults?.set(sessionCount, forKey: "doom_scroll_count")
    }
}
```

**Thresholds are configurable by the user:**
- First interrupt: 10 minutes (default)
- Second interrupt: 30 minutes after first
- Third interrupt: shows summary + gentle "time to stop" message

### Shield Extension UI Limitations

The `ShieldConfigurationExtension` can only return:
```swift
ShieldConfiguration(
    backgroundBlurStyle: .systemMaterial,
    backgroundColor: UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0), // our green tint
    icon: UIImage(named: "shield-icon"), // our app icon
    title: ShieldConfiguration.Label(text: "Take a breath first", color: .label),
    subtitle: ShieldConfiguration.Label(text: "5 seconds to check in with yourself", color: .secondaryLabel),
    primaryButtonLabel: ShieldConfiguration.Label(text: "Start breathing", color: .white),
    primaryButtonBackgroundColor: UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0), // #40916C
    secondaryButtonLabel: ShieldConfiguration.Label(text: "Go back", color: .secondaryLabel)
)
```

It **cannot** render:
- Custom animations (no breathing circle)
- Custom haptic patterns
- Arbitrary SwiftUI views
- Network requests

**Therefore:** The shield is a "landing page" that redirects to our app for the actual breathing experience. The shield itself is static text + buttons.

### Data Sharing Between Extensions and Main App

Extensions run in separate processes and cannot access the main app's memory, Supabase client, or React Native bridge.

**Solution: App Groups + shared UserDefaults**

```swift
// Shared data contract
struct GatewaySharedData: Codable {
    var shieldedApps: Set<ApplicationToken>
    var breathDuration: Int // seconds
    var freeWindows: [TimeWindow]
    var doomScrollThresholds: [Int] // minutes
    var currentStrategy: StrategySnapshot? // pre-computed by main app
}

struct StrategySnapshot: Codable {
    var taskTitle: String
    var taskOrder: Int
    var strategyText: String // first 200 chars of task_body
}
```

The main app writes this to shared UserDefaults whenever toolkit or settings change. Extensions read from it. **No network calls in extensions.**

The strategy snapshot is pre-computed by the main app every time the toolkit changes or the app foregrounds. This means the SR selection happens in the main app (where we have full access to Supabase data), and the result is cached in shared storage for the extension to read.

---

## V2: Novelty Interventions

### Why Novelty Matters for ADHD

The breathing circle will lose effectiveness after 2-4 weeks as ADHD brains habituate. Rotating the intervention type prevents habituation and keeps the prefrontal cortex engaged.

### Intervention Types (all implementable in React Native)

| Intervention | Implementation | Sensor/API |
|---|---|---|
| **Breathing circle** (default) | Reanimated animation + CoreHaptics | None |
| **Rotate phone 3x** | Track gyroscope rotation, count full 360° rotations | `expo-sensors` Gyroscope |
| **Shake phone** | Accelerometer threshold detection | `expo-sensors` Accelerometer |
| **Type random phrase** | TextInput with exact match validation | None |
| **Hold phone still** | Accelerometer — require near-zero movement for 5 sec | `expo-sensors` Accelerometer |
| **Mirror pause** | Front camera showing user's face for 5 seconds (self-confrontation) | `expo-camera` |
| **Count backwards** | Show a number (e.g., 847), user types it minus 7 (840) | None |
| **Squeeze and release** | Haptic ramp up → prompt to squeeze → release → haptic fade | CoreHaptics |
| **Trace a pattern** | SVG path on screen, user drags finger along it | PanResponder / Gesture Handler |

### Implementation Architecture

```tsx
// InterventionRouter — picks intervention based on user config + novelty rotation
function getIntervention(config: GatewayConfig): InterventionType {
  const available = config.enabledInterventions; // user picks which they want
  const lastUsed = config.lastInterventionType;

  // Never repeat the same intervention twice in a row
  const candidates = available.filter(i => i !== lastUsed);

  // Weighted random: favor less-recently-used interventions
  return weightedRandom(candidates, config.interventionHistory);
}

// Each intervention is a component that calls onComplete() when finished
<GatewayScreen>
  {interventionType === 'breathing' && <BreathingCircle onComplete={handleDone} />}
  {interventionType === 'rotate' && <RotatePhone onComplete={handleDone} />}
  {interventionType === 'shake' && <ShakePhone onComplete={handleDone} />}
  {interventionType === 'type' && <TypePhrase onComplete={handleDone} />}
  {interventionType === 'mirror' && <MirrorPause onComplete={handleDone} />}
  ...
</GatewayScreen>
```

### V2 Schedule Blocks (Hard Blocking)

> User's concern: "Hard blocks just make me angry/annoyed with my past self"

**This concern is well-founded and supported by research:**
- ADHD brains have heightened sensitivity to restriction (oppositional defiance tendency)
- Hard blocks trigger **psychological reactance** — the desire to do the blocked thing *increases*
- When frustrated, ADHD users will find workarounds (uninstall the app, use browser instead)
- The block-then-frustration-then-override cycle creates shame and learned helplessness

**Recommendation: Do NOT implement hard blocks.** Instead, use **escalating friction**:
1. First open: 5-second breathing pause
2. After 10 min: 10-second pause + strategy reminder
3. After 30 min: 15-second pause + usage summary + reflection prompt ("You've spent 30 minutes. Is this what you wanted to do?")
4. After 60 min: Same pause + option to set a "done for now" reminder in 15 min

The user can ALWAYS choose to continue. The friction just gets slightly higher. This respects autonomy while providing escalating external cues.

If hard blocks are implemented in a future version, they should be:
- **User-initiated in the moment** ("Lock Instagram for the next 2 hours" — not scheduled by past-self)
- **Always overridable** with a 30-second cooldown (type "I want to override" or similar)
- **Never the default**

---

## Open Limits — Daily App-Open Budget

### Concept

Users set a daily open limit per app (e.g., "Instagram: 5 opens per day"). The first N opens go through normally (with or without the standard breathing intervention, depending on user config). Once the limit is hit, **every subsequent open triggers an intervention** — and the intervention duration **escalates** with each additional open.

This creates a "budget" mental model that ADHD brains respond well to: "I have 5 Instagram opens today. Do I want to spend one now?" It externalizes the scarcity that ADHD brains can't self-generate.

### How It Feels

| Open # | Experience |
|--------|-----------|
| 1–5 (under limit) | Normal gateway: 5-sec breathing + strategy (or skip if in free window) |
| 6 (first over limit) | 8-sec intervention + message: "You've opened Instagram 6 times today. Your limit was 5." |
| 7 | 11-sec intervention + message: "7 times today." |
| 8 | 14-sec intervention |
| 10+ | 20-sec intervention (capped) + "You've opened this app 10 times. Want to add it to your toolkit goals?" |

**Formula:** `duration = baseDuration + max(0, openCount - limit) * increment`

Default: `base = 5s`, `increment = 3s`, `cap = 20s`

User can configure all three values. The increment can be set to 0 for flat-duration interventions (same experience every time, no escalation). Or cranked up for aggressive escalation.

### Implementation

#### V1 (Shortcuts-based)

Tracking opens is simple — every gateway activation arrives via deep link with the app name as a query param. We count them client-side:

```ts
// stores/gatewayStore.ts (Zustand + AsyncStorage persist)
interface GatewayStore {
  dailyOpenCounts: Record<string, { date: string; count: number }>;
  incrementOpen: (appId: string) => number; // returns new count
  getOpenCount: (appId: string) => number;
  resetIfNewDay: () => void;
}

// On gateway mount:
const count = gatewayStore.incrementOpen(targetApp);
const limit = userConfig.openLimits[targetApp] ?? Infinity;
const isOverLimit = count > limit;
const duration = isOverLimit
  ? Math.min(config.baseDuration + (count - limit) * config.increment, config.cap)
  : config.baseDuration;
```

**Storage:** Zustand store persisted to AsyncStorage. Resets daily (compare stored date key vs today). No server writes needed for counting.

**Optional server sync:** Write daily summaries to Supabase at end of day for analytics ("user opened Instagram 12 times, limit was 5"). This is a single INSERT per app per day — negligible.

#### V1.5 (FamilyControls-based)

With FamilyControls, we get **real** open tracking via `DeviceActivityMonitor`:

```swift
// DeviceActivityMonitorExtension.swift
override func eventDidReachThreshold(
    _ event: DeviceActivityEvent.Name,
    activity: DeviceActivityName
) {
    // event.rawValue encodes which app and which threshold
    // e.g., "instagram_open_5" = 5th open of Instagram

    let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
    let openCount = (sharedDefaults?.integer(forKey: "\(appId)_opens_today") ?? 0) + 1
    sharedDefaults?.set(openCount, forKey: "\(appId)_opens_today")

    // Apply shield with escalating context
    store.shield.applications = tokens
    sharedDefaults?.set(openCount, forKey: "current_intervention_open_count")
}
```

The `DeviceActivityMonitor` can track **application launch events** (not just time thresholds). We register an event per app with a threshold of N launches, and iOS calls our extension when it's hit. This is more reliable than the Shortcuts approach since:
- It counts even if the user bypasses our gateway somehow
- It works in background without our app running
- Counts reset automatically with `DeviceActivitySchedule` (daily schedule)

### Config UI

```
┌─────────────────────────────────────┐
│ Open Limits                         │
│                                     │
│ Instagram          5 opens/day  [▸] │
│ TikTok             3 opens/day  [▸] │
│ YouTube            8 opens/day  [▸] │
│ Twitter            5 opens/day  [▸] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Escalation                      │ │
│ │                                 │ │
│ │ Base pause:    5 sec     [-][+] │ │
│ │ Extra per open: +3 sec   [-][+] │ │
│ │ Maximum:       20 sec    [-][+] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Add app]                         │
└─────────────────────────────────────┘
```

The per-app limit picker can use a stepper (1–20 range) or a wheel picker for quick selection. The escalation config is an advanced section, collapsed by default with sensible defaults.

### Data Model

```ts
interface OpenLimitConfig {
  appId: string;           // "instagram", "tiktok", etc.
  dailyLimit: number;      // e.g., 5
  enabled: boolean;
}

interface EscalationConfig {
  baseDurationSeconds: number;      // default 5
  incrementPerOpenSeconds: number;  // default 3
  capSeconds: number;               // default 20
}

// Stored in gateway_config table or user profile JSONB
interface GatewayConfig {
  breathDurationSeconds: number;
  freeWindows: TimeWindow[];
  openLimits: OpenLimitConfig[];
  escalation: EscalationConfig;
}
```

### Scaling Note

Open counts are tracked **entirely client-side** (Zustand + AsyncStorage for V1, shared UserDefaults for V1.5). The only server touch is the optional end-of-day analytics summary — one row per app per day per user. At 100K users with 5 tracked apps each: 500K rows/day = ~6 writes/sec. Trivial.

### ADHD Design Considerations

- **Show remaining opens** on the gateway screen: "You have 3 Instagram opens left today." This externalizes the budget and helps with decision-making.
- **Don't shame.** When over-limit, use neutral language: "You've gone past your limit. That's okay — here's a moment to pause." Not: "You've exceeded your limit!" (triggers shame spiral).
- **Allow limit adjustment anytime.** Don't lock the user into a limit set by past-self. They can change it mid-day. This respects autonomy and prevents reactance. We can gently note: "You've increased your limit twice today" without blocking the change.
- **Celebrate staying under limit.** End-of-day notification: "You stayed within your Instagram limit today. 🧰" — ties back to identity framing ("I'm someone who controls my screen time").
- **Weekly summary.** Show trends: "This week you averaged 4 Instagram opens/day (limit: 5). Last week: 7." Progress visibility without judgment.

---

## Answering Your Design Questions

### V1: Simple 5-sec or more options?

**Ship V1 with: 5-sec breathing + schedule config (free windows).**

The free-window schedule IS worth including in V1 because:
- It's pure JS — no native work, no Apple approval
- It provides the ADHD reward mechanism: "Work now, apps unlock at 5pm friction-free"
- It makes the feature feel less oppressive (there's a light at the end of the tunnel)
- Without it, users may just disable the Shortcuts entirely

**Do NOT include in V1:**
- Doom-scroll brake (requires FamilyControls)
- Multiple intervention types (V2)
- Hard blocks (never, per above)

**The 10min/30min re-interrupt should wait for V1.5.** For V1, send a local notification at 10 min ("You've been on Instagram for 10 minutes. Take a breath?") — it's a nudge, not an enforcement, but it's honest about the limitation.

### Do we need Swift code?

**V1:** Yes, one small native module for `CoreHaptics` synchronized breathing patterns (~100 lines of Swift + ObjC bridge). Everything else is React Native.

**V1.5:** Yes, significantly more Swift:
- `ShieldConfigurationExtension` (~50 lines)
- `DeviceActivityMonitorExtension` (~80 lines)
- `FamilyControlsBridge` native module (~150 lines)
- Shared App Group data layer (~60 lines)

**V2:** No additional Swift. All interventions (gyroscope, accelerometer, camera, text input) use existing Expo/RN APIs.

### Performance

**Animation performance:**
- Breathing circle runs on Reanimated's UI thread (C++ worklet). Zero JS thread involvement. Buttery smooth even if JS is busy.
- CoreHaptics runs on a dedicated system thread. Zero impact on app performance.
- Strategy card rendering is a single static view — negligible.

**Gateway activation latency:**
- Shortcuts approach: ~300-500ms (iOS opens our app via URL scheme)
- FamilyControls approach: ~200ms (shield is pre-rendered by system, button tap opens our app)
- Both are acceptable — the user expects a brief transition.

**Memory:**
- GatewayScreen is a single screen with one animated view + one card. ~2-5MB.
- ShieldConfigExtension has a 6MB memory limit — our shield config is well under 1MB.
- DeviceActivityMonitorExtension has a 6MB limit — our threshold handler is trivial.

### Scalability: 1K, 10K, 100K Users

**The gateway is fundamentally a client-side feature.** The server is barely involved.

| Component | Server Impact | At 1K users | At 10K users | At 100K users |
|---|---|---|---|---|
| **Breathing animation** | None (client) | N/A | N/A | N/A |
| **Haptics** | None (client) | N/A | N/A | N/A |
| **Strategy selection** | None (client, cached data) | N/A | N/A | N/A |
| **SR state update** | 1 row upsert per gateway use | ~50 writes/hr | ~500 writes/hr | ~5K writes/hr |
| **Open-count tracking** | None (client, AsyncStorage/UserDefaults) | N/A | N/A | N/A |
| **Open-count analytics** | 1 INSERT per app per day (optional) | ~25 writes/hr | ~250 writes/hr | ~2.5K writes/hr |
| **Toolkit item fetch** | Cached by TanStack Query | Minimal | Minimal | Minimal |
| **Gateway config sync** | 1 row read on app foreground | Trivial | Trivial | Trivial |

**SR state updates are the only server writes**, and they're:
- A single `UPSERT` on a table with a unique index — O(1) per write
- Batched naturally (user sees max ~10-20 gateways per day)
- Can be debounced (batch multiple strategy views into one write per app session)

**At 100K users with 15 gateway activations/day = ~1.5M upserts/day = ~17 writes/sec.** Supabase (Postgres) handles this trivially. No scaling concerns until 1M+ daily active users.

**Client-side caching strategy:**
- Toolkit items + SR states are fetched once per app foreground via TanStack Query
- Cached in memory for the session
- Gateway strategy selection reads from cache — zero network during the breathing experience
- SR update fires as a background mutation after the gateway closes

### Extension Memory Budgets (FamilyControls)

Apple enforces strict memory limits on app extensions:
- ShieldConfigExtension: 6MB — our config is <1MB ✅
- DeviceActivityMonitorExtension: 6MB — our handler is <1MB ✅
- Both extensions share data via App Group UserDefaults, not SQLite (simpler, fits in budget)

If the strategy snapshot in shared UserDefaults exceeds limits (unlikely — it's ~500 bytes), we can:
- Only cache 3-5 strategies instead of all toolkit items
- Use a shared SQLite database (via App Groups) for larger datasets

---

## UX: Where It Lives, How Users Find It, How They Configure It

### Existing Code to Build On

The app already has a working "App Disrupt" feature:
- **`DisruptScreen.tsx`** — Full breathing overlay with animated circle, countdown, phase labels, haptics, and "Continue to [app]" / "Open Next Thing" buttons. Already handles the `nextthing://disrupt?app=X` deep link.
- **`DisruptSetupScreen.tsx`** — Step-by-step iOS Shortcuts tutorial with animated transitions. Lists common distracting apps. Already branded "App Disrupt."
- **Account tab** — Has a "Set up App Disrupt" button in the "Extras" card.
- **Journey tab** — Day 17 shows "Open mindful gateway tutorial" button.
- **`MindfulGatewayTutorial.tsx`** — Older, simpler tutorial (superseded by DisruptSetupScreen).

**The FamilyControls upgrade replaces the Shortcuts setup flow, enhances the breathing screen, and adds the settings/config UI. The existing DisruptScreen is the foundation — we evolve it, not rewrite it.**

### Naming: "App Disrupt" stays

The feature is already branded "App Disrupt" in the UI. Keep this name — it's punchy, action-oriented, and already in user-facing copy. "Mindful Gateway" is the internal/design-doc name.

### Navigation Structure

```
Tab: Toolkit
  └── 🧘 App Disrupt card (prominent, between progress bar and toolkit strategies)
       └── tap → GatewaySettingsScreen (full-screen push)
            ├── Enable/disable toggle
            ├── App picker (FamilyActivityPicker)
            ├── Open limits per app
            ├── Escalation config
            ├── Free windows (schedule)
            └── Advanced: doom-scroll thresholds

Tab: Account
  └── "Extras" card
       └── "App Disrupt settings" → same GatewaySettingsScreen (secondary access point)
```

**Why the Toolkit tab?** App Disrupt is the delivery mechanism for toolkit strategies — it resurfaces them during the breathing pause. It belongs with the strategies, not buried in account settings. Placing it between the progress bar and "My toolkit" section makes it prominent without adding a new tab.

**Why NOT a separate tab?** Three active tabs (Journey, Toolkit, Account) is the right number. A fourth tab for one feature adds clutter. The Toolkit tab is the natural home.

**Why a card in Toolkit, not just Account?** ADHD users won't dig through settings to find this. A visible card with status ("Active — 4 apps shielded") on the tab they check regularly ensures they discover and maintain it.

### Discovery: How Users First Set It Up

**Three touchpoints, in order of likelihood:**

1. **Day 17 journey task** (already exists) — When the user reaches task 17 ("Set up a mindful gateway"), the Journey tab shows a CTA. Currently opens the old tutorial. **Upgrade:** Open GatewaySettingsScreen directly with a first-run onboarding flow baked in.

2. **Toolkit tab card** — Always visible once the user has completed at least one task. Shows setup prompt if not configured, status summary if active.

3. **Account tab** — "App Disrupt settings" button in Extras card. Secondary access for users who expect settings to live in Account.

**NOT part of initial onboarding.** The user hasn't built any toolkit strategies yet during onboarding. App Disrupt makes sense only after they've experienced the journey and retained some strategies. Day 17 is the right moment — they're invested, they have strategies, and the journey task gives context for why this matters.

### Toolkit Tab: The App Disrupt Card

Sits between the progress bar and "🧰 My toolkit" section:

```
┌──────────────────────────────────────┐
│  Toolkit tab                         │
│                                      │
│  ╭──────╮  🔥 7 • 12/30 explored   │ ← Progress bar (existing)
│  ╰──────╯                            │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🧘 App Disrupt         [▸]  │    │ ← NEW: Gateway card
│  │                              │    │
│  │ Active — 4 apps shielded    │    │
│  │ 2 of 5 Instagram opens used │    │
│  └──────────────────────────────┘    │
│                                      │
│  🧰 My toolkit                      │ ← Existing toolkit strategies
│  ...                                 │
└──────────────────────────────────────┘
```

**States:**

| State | Card content |
|-------|-------------|
| **Not set up** | "🧘 App Disrupt — Add a breathing pause before distracting apps. [Set up ▸]" |
| **Active, under limits** | "🧘 App Disrupt — Active · 4 apps shielded · 2/5 Instagram opens [▸]" |
| **Active, over limit** | "🧘 App Disrupt — Active · Instagram limit reached (7/5) [▸]" |
| **Paused by user** | "🧘 App Disrupt — Paused [▸]" |

Tapping the card always navigates to `GatewaySettingsScreen`.

### GatewaySettingsScreen: Full Layout

A dedicated full-screen push (not a modal, not inline in Account). Clean, sectioned, with sensible defaults pre-set.

```
┌─────────────────────────────────────────┐
│  ← Back                                │
│                                         │
│  APP DISRUPT                            │
│  Control how distracting apps behave    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Enable App Disrupt    [toggle]  │    │
│  │                                 │    │
│  │ Adds a breathing pause before   │    │
│  │ you open selected apps.         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ SHIELDED APPS                   │    │
│  │                                 │    │
│  │ Instagram             ✓        │    │
│  │ TikTok                ✓        │    │
│  │ YouTube               ✓        │    │
│  │ X (Twitter)           ✓        │    │
│  │ Reddit                         │    │
│  │ Facebook                       │    │
│  │ Snapchat                       │    │
│  │                                 │    │
│  │ [Choose apps...]               │    │ ← Opens FamilyActivityPicker
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ OPEN LIMITS                     │    │
│  │                                 │    │
│  │ Instagram     5 /day    [-][+]  │    │
│  │ TikTok        3 /day    [-][+]  │    │
│  │ YouTube       8 /day    [-][+]  │    │
│  │ X (Twitter)   5 /day    [-][+]  │    │
│  │                                 │    │
│  │ ℹ️ After reaching your limit,   │    │
│  │ pauses get longer each time.    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ FREE WINDOWS                    │    │
│  │                                 │    │
│  │ Apps open without a pause       │    │
│  │ during these times.             │    │
│  │                                 │    │
│  │ Evening     5:00 PM — 8:00 PM  │    │
│  │                                 │    │
│  │ [+ Add window]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ▼ Advanced                             │ ← Collapsed by default
│  ┌─────────────────────────────────┐    │
│  │ BREATHING PAUSE                 │    │
│  │ Duration:    5 sec      [-][+]  │    │
│  │                                 │    │
│  │ ESCALATION (after limit)        │    │
│  │ Extra per open: +3 sec  [-][+]  │    │
│  │ Maximum:       20 sec   [-][+]  │    │
│  │                                 │    │
│  │ DOOM SCROLL BRAKE               │    │
│  │ First check-in: 10 min [-][+]  │    │
│  │ Second:         30 min [-][+]  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ TODAY'S STATS                   │    │
│  │                                 │    │
│  │ Instagram   ████░  4/5         │    │
│  │ TikTok      ██░░░  2/3         │    │
│  │ 🧘 3 breathing pauses today    │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Defaults (Pre-Set on First Enable)

The goal is zero-config for the 80% case. User taps "Enable", picks apps, and they're immediately protected with sensible defaults:

| Setting | Default | Why |
|---------|---------|-----|
| **Breathing duration** | 5 seconds | Research-backed minimum for prefrontal cortex engagement. Short enough to not frustrate. |
| **Open limit** (per app) | 5 opens/day | Low enough to create awareness, high enough to not trigger reactance. "One Sec" research suggests 5-8 is the sweet spot. |
| **Escalation increment** | +3 sec/open over limit | Noticeable but not punishing. 6th open = 8s, 7th = 11s, 8th = 14s. |
| **Escalation cap** | 20 seconds | Long enough to be genuinely inconvenient. Short enough to not enrage. |
| **Free windows** | None | User adds if they want. We don't presume their schedule. |
| **Doom scroll: first** | 10 minutes | Catches the "I'll just check one thing" that becomes 45 minutes. |
| **Doom scroll: second** | 30 minutes after first | For when they consciously chose to continue. Gentle, not aggressive. |
| **Pre-selected apps** | None (user must choose) | Apple's FamilyActivityPicker requires explicit selection. We can't pre-select. We do show common suggestions. |

### First-Run Flow (When User Taps "Enable" for First Time)

Instead of dumping the user on the full settings screen, the first enable triggers a 3-step guided flow:

```
Step 1: "Pick your trigger apps"
  → FamilyActivityPicker opens
  → User checks boxes
  → "Next"

Step 2: "Set your daily limits"
  → Shows selected apps with stepper controls
  → Pre-filled with default (5/day)
  → "These are suggestions — change them anytime"
  → "Next"

Step 3: "You're set!"
  → Summary: "4 apps shielded. 5 opens/day each."
  → "You can adjust everything in Toolkit → App Disrupt"
  → "Done"
```

After this, the full settings screen is always accessible for tweaking. The guided flow only shows once.

### Account Tab: Minimal Footprint

The Account tab already has an "Extras" card with a "Set up App Disrupt" button. **Replace** that button with:

```
App Disrupt settings  [▸]
```

This navigates to the same `GatewaySettingsScreen`. One line, not a new card. No settings bloat. The Account tab stays focused on account-level concerns (theme, notifications, billing, sign out).

### File Structure for Settings UI

```
apps/mobile/
├── app/
│   ├── gateway-settings.tsx              # Route: GatewaySettingsScreen
│   └── disrupt.tsx                       # Existing: breathing overlay (keep)
│
├── src/
│   ├── screens/gateway/
│   │   ├── GatewaySettingsScreen.tsx     # Full settings UI
│   │   ├── GatewayFirstRunFlow.tsx       # 3-step guided setup
│   │   ├── AppDisruptCard.tsx            # Toolkit tab summary card
│   │   ├── OpenLimitRow.tsx              # Per-app limit stepper
│   │   └── FreeWindowRow.tsx             # Time window picker
│   │
│   ├── screens/disrupt/
│   │   ├── DisruptScreen.tsx             # Existing breathing overlay (enhance)
│   │   └── DisruptSetupScreen.tsx        # Keep as Shortcuts fallback (iOS <16)
│   │
│   ├── stores/
│   │   └── gatewayStore.ts              # Zustand: open counts, config, schedule
│   │
│   └── hooks/
│       └── useGatewayConfig.ts          # Read/write gateway config
```

### Handling the Existing "Mindful Gateway Tutorial" (Day 17)

Currently Day 17 shows "Open mindful gateway tutorial" which opens the old `MindfulGatewayTutorial.tsx`. **Replace:**

- If FamilyControls is available (iOS 16+): Open `GatewaySettingsScreen` with `firstRun=true` query param to trigger the guided setup flow.
- If FamilyControls is unavailable (iOS 15, Android): Open `DisruptSetupScreen` (Shortcuts tutorial) as fallback.

```tsx
// In JourneyScreen, replace the day 17 button handler:
onPress={() => {
  if (Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 16) {
    router.push("/gateway-settings?firstRun=true");
  } else {
    router.push("/disrupt-setup");
  }
}}
```

### Testing with Xcode (Without Apple Entitlement)

FamilyControls can be tested in Xcode Simulator and on physical devices using a **development provisioning profile** — the entitlement only needs Apple approval for App Store distribution. During development:

1. Add `com.apple.developer.family-controls` to the development entitlements file
2. Run on physical device via Xcode (Simulator has limited FamilyControls support)
3. `AuthorizationCenter.shared.requestAuthorization(for: .individual)` works normally
4. Shields apply, DeviceActivityMonitor fires, everything functions
5. Only when submitting to TestFlight/App Store do you need the approved entitlement

This means we can **build and test the full FamilyControls implementation locally** before Apple approves anything. Submit the entitlement request early, build in parallel.

---

## Implementation Phases

### Phase 1 (V1): Shortcuts Gateway + Settings UI — 1-2 weeks

We proceed with FamilyControls as the target (testable locally in Xcode). Shortcuts flow is kept as fallback for iOS <16 / Android.

1. **BreathingHapticsModule.swift** — CoreHaptics native module
2. **Enhance DisruptScreen.tsx** — Add toolkit strategy card, open-count display, remaining-opens badge, escalating duration
3. **useGatewayStrategy.ts** — SR-based strategy picker from toolkit cache
4. **useBreathingCycle.ts** — Timer + haptic sync hook
5. **gatewayStore.ts** — Zustand store: open counts (daily reset), config, schedule
6. **useGatewayConfig.ts** — Read/write gateway config hook
7. **GatewaySettingsScreen.tsx** — Full settings UI (enable toggle, app list, open limits, free windows, advanced section, today's stats)
8. **GatewayFirstRunFlow.tsx** — 3-step guided setup (pick apps → set limits → done)
9. **AppDisruptCard.tsx** — Toolkit tab summary card (status, open counts, tap to settings)
10. **OpenLimitRow.tsx** + **FreeWindowRow.tsx** — Reusable settings components
11. **Wire into Toolkit tab** — Insert AppDisruptCard between progress bar and "My toolkit"
12. **Update Account tab** — Replace "Set up App Disrupt" button with "App Disrupt settings [▸]" link to GatewaySettingsScreen
13. **Update Day 17 handler** — Route to GatewaySettingsScreen (firstRun) on iOS 16+, DisruptSetupScreen fallback otherwise
14. **`gateway-settings.tsx` route** — Expo Router entry point
15. **Local notification** at 10 min as soft doom-scroll nudge

### Phase 2 (V1.5): FamilyControls Native — 4-6 weeks after Phase 1

Request `family-controls` entitlement from Apple **IMMEDIATELY** — submit before Phase 1 code is done. Build and test locally in Xcode while waiting.

1. **FamilyControlsBridge.swift** — Authorization, FamilyActivityPicker presentation, shield management
2. **ShieldConfigExtension** — Custom shield appearance ("Take a breath" → opens app)
3. **DeviceActivityMonitorExtension** — Usage threshold → re-shield + open-count tracking via launch events
4. **App Group shared data** — Strategy snapshots, config, shield tokens, open counts in shared UserDefaults
5. **Doom-scroll brake UI** — Escalating friction messages on DisruptScreen
6. **Config plugin** for Expo (add extensions to Xcode project, App Group entitlements)
7. **Update GatewayFirstRunFlow** — Replace Shortcuts steps with native FamilyActivityPicker (one-tap)
8. **Update GatewaySettingsScreen** — Shielded Apps section shows FamilyActivityPicker instead of manual list

### Phase 3 (V2): Novelty Interventions — 2-3 weeks after Phase 2

1. **Intervention type components** — RotatePhone, ShakePhone, TypePhrase, MirrorPause, etc.
2. **InterventionRouter** — Weighted random selection with no-repeat logic
3. **Settings UI** — User picks which intervention types they want
4. **Intervention history tracking** — For novelty rotation algorithm
5. **A/B testing framework** — Measure which interventions reduce app-opening rate most

---

## App Config Changes Required

```ts
// app.config.ts additions for V1
{
  ios: {
    bundleIdentifier: "app.nextthing.mobile",
    infoPlist: {
      // Deep link support
      CFBundleURLTypes: [{
        CFBundleURLSchemes: ["nextthing"],
      }],
    },
  },
}

// Additional for V1.5
{
  ios: {
    entitlements: {
      "com.apple.developer.family-controls": true,
    },
    appGroupIdentifiers: ["group.app.nextthing"],
  },
}
```

### Expo Config Plugin (V1.5)

FamilyControls extensions cannot be created by Expo's build system automatically. We need a **config plugin** that:
1. Adds the Shield and DeviceActivity extensions to the Xcode project
2. Sets up App Group entitlements for all targets
3. Configures the extension bundle IDs
4. Links the FamilyControls and ManagedSettings frameworks

This is a non-trivial plugin (~200 lines) but follows established patterns from `expo-notification-service-extension` and similar community plugins.

---

## Open Questions

1. **iOS Shortcuts confirmation dialog**: In iOS 17+, Apple sometimes shows "Run this automation?" before executing. This adds friction on top of our friction. Need to test on latest iOS versions to see if "Run immediately" works without confirmation for URL-open automations.

2. **FamilyControls Individual authorization stability**: Some reports of iOS occasionally revoking Individual authorization on iOS updates. Need a graceful fallback that re-requests auth on next app foreground.

3. **App URL schemes for "Continue" button**: Not all apps have reliable URL schemes. Need a mapping table:
   - `instagram://` ✅
   - `tiktok://` ✅
   - `youtube://` ✅
   - `twitter://` ✅
   - `facebook://` ✅
   - Games: varies — may need to fall back to a "Return to app" generic prompt

4. **Expo EAS Build compatibility**: Need to verify that native Swift modules and app extensions build correctly in EAS Build (they do, but custom config plugins need testing per EAS version).
