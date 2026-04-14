# iOS Widgets — Design & Implementation Plan

## Overview

WidgetKit widgets are small, glanceable views on the Home Screen, Lock Screen, and StandBy mode. They're ideal for ADHD users because they provide **passive visual cues** — the user sees their progress/strategy/streak without opening the app. This reduces the "out of sight, out of mind" problem that kills habit formation.

**Critical constraint:** Widgets are SwiftUI-only. No React Native, no JavaScript, no Reanimated. They run in a separate extension process with limited memory. All data must be pre-computed by the main app and shared via App Groups.

---

## Widget Candidates

### 1. 🔥 Streak + Progress Ring (RECOMMENDED FOR V1)

**What it shows:**
- Current streak count (flame emoji + number)
- Progress ring (X of 30 strategies explored)
- Today's task title (single line, truncated)

**Sizes:** Small (2×2), Medium (4×2)

```
┌──────────────────┐     ┌──────────────────────────────────────┐
│   Small (2×2)    │     │           Medium (4×2)               │
│                  │     │                                      │
│   ╭──────╮       │     │  ╭──────╮  🔥 7-day streak          │
│   │ 12   │  🔥7  │     │  │ 12   │                            │
│   │ ──── │       │     │  │ ──── │  Today: Build a shutdown   │
│   │  30  │       │     │  │  30  │  ritual for your workday   │
│   ╰──────╯       │     │  ╰──────╯                            │
│  Today's task ▸  │     │                        [Open] ▸      │
└──────────────────┘     └──────────────────────────────────────┘
```

**Lock Screen variant (circular):**
```
  ╭────╮
  │ 🔥 │
  │  7  │
  ╰────╯
```

**Why V1:** Minimal data needed (streak count, completed count, total tasks, current task title). All already available in `JourneyState`. Low implementation complexity. High daily visibility.

**Implementation difficulty: LOW ⬇️**
- No special permissions
- Data: 4 fields from JourneyState
- SwiftUI: ~80 lines for small, ~120 for medium
- Timeline: Static (update on app foreground + after check-in)

---

### 2. 🧰 Toolkit Strategy Card

**What it shows:**
- One retained toolkit strategy, rotated daily (or per SR schedule)
- Day number + strategy title
- Tap opens the full strategy in-app

**Sizes:** Medium (4×2), Large (4×4)

```
┌──────────────────────────────────────┐
│           Medium (4×2)               │
│                                      │
│  🧰 Today's strategy                │
│                                      │
│  Day 5: Use the 2-minute rule       │
│  If it takes less than 2 minutes,   │
│  do it now instead of adding it...  │
│                                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           Large (4×4)                │
│                                      │
│  🧰 Today's strategy                │
│                                      │
│  Day 5: Use the 2-minute rule       │
│                                      │
│  If it takes less than 2 minutes,   │
│  do it now instead of adding it     │
│  to your list. This prevents task   │
│  buildup and reduces the mental     │
│  load of tracking tiny things.      │
│                                      │
│  ── ── ── ── ── ── ── ── ── ── ──  │
│                                      │
│  "I'm someone who handles small     │
│   things immediately." 💪            │
│                                      │
│                        [Practice] ▸  │
└──────────────────────────────────────┘
```

**Why this matters for ADHD:** This is the **spaced repetition delivery mechanism** that requires zero user effort. The strategy sits on their Home Screen, passively reinforcing it throughout the day. The user doesn't even need to open the app.

**Implementation difficulty: MEDIUM ⬡**
- No special permissions
- Data: Current toolkit strategy snapshot (pre-computed by SR algorithm)
- SwiftUI: ~150 lines for medium, ~200 for large
- Timeline: Update once daily (or when SR schedule changes)
- **Depends on:** Toolkit feature being complete (it is now ✅)

---

### 3. 📊 Gateway Stats

**What it shows:**
- Today's app-open counts vs limits
- Mini bar chart or simple list
- "4 of 5 Instagram opens used"

**Sizes:** Medium (4×2)

```
┌──────────────────────────────────────┐
│        Gateway Stats                 │
│                                      │
│  Instagram   ████░  4/5             │
│  TikTok      ██░░░  2/5             │
│  YouTube     █░░░░  1/8             │
│                                      │
│  🧘 3 breathing pauses today        │
└──────────────────────────────────────┘
```

**Implementation difficulty: MEDIUM ⬡**
- No special permissions for the widget itself
- Data: Open counts from `gatewayStore` (shared via App Group)
- SwiftUI: ~120 lines
- Timeline: Update frequently (every 15 min, or on significant events)
- **Depends on:** Open Limits feature + Gateway being active

---

### 4. ⏱️ Doom Scroll Timer (Live Activity)

**What it shows:**
- A real-time timer counting how long you've been in a distracting app
- Color shifts from green → yellow → red as time increases
- Tap to trigger breathing intervention

**Type:** Live Activity (Dynamic Island + Lock Screen banner)

```
┌─ Dynamic Island ────────────────────┐
│  📱 Instagram  ●  12:34             │
└─────────────────────────────────────┘

┌─ Lock Screen Live Activity ─────────┐
│  📱 Instagram                       │
│  12 minutes • Limit: 10 min        │
│  ████████████░░░░░  [Take a break]  │
└─────────────────────────────────────┘
```

**Implementation difficulty: HIGH ⬆️**
- **Requires FamilyControls** to know when user is in a distracting app
- Live Activities use ActivityKit (iOS 16.1+)
- Must be started/updated from DeviceActivityMonitor extension
- Extensions have severe memory limits — ActivityKit updates must be lightweight
- **Apple review risk:** Live Activities from background extensions can be rejected if Apple considers them too aggressive
- SwiftUI: ~200 lines + ActivityKit configuration

**Hurdles:**
- 🔴 **FamilyControls entitlement required** — same as V1.5 gateway
- 🔴 **Background execution** — the extension needs to start a Live Activity from background, which Apple scrutinizes
- 🟡 **Battery impact** — frequent updates to Dynamic Island consume battery. Must cap update frequency.
- 🟡 **User perception** — a timer on the Dynamic Island could feel surveillant/shaming if not done carefully. Needs very gentle copy.

---

### 5. 💬 Daily Motivation Quote

**What it shows:**
- A short motivational quote from the `motivation.ts` constants
- Rotated daily
- Our brand color background

**Sizes:** Small (2×2), Medium (4×2)

```
┌──────────────────┐
│   Small (2×2)    │
│                  │
│  "Starting is    │
│   the hardest    │
│   part — and     │
│   you just       │
│   did it."       │
│                  │
└──────────────────┘
```

**Implementation difficulty: VERY LOW ⬇️⬇️**
- No special permissions
- No real data needed — quotes are static, rotated by day-of-year
- SwiftUI: ~50 lines
- Timeline: Update once daily

**Downside:** Low utility. Motivational quotes are commodity content. Doesn't leverage our app's unique value (toolkit strategies, SR, gateway). Fine as a secondary widget, but shouldn't be the first one we ship.

---

### 6. ✅ Today's Task Action Card

**What it shows:**
- Today's task title and brief description
- "Check in" button → opens app directly to check-in flow
- Status indicator (not started / in progress / completed today)

**Sizes:** Medium (4×2), Large (4×4)

```
┌──────────────────────────────────────┐
│  Day 12 of 30                       │
│                                      │
│  Build a shutdown ritual for your    │
│  workday                             │
│                                      │
│  ○ Not started    [Start check-in ▸] │
└──────────────────────────────────────┘

(After completion:)
┌──────────────────────────────────────┐
│  Day 12 of 30                  ✅    │
│                                      │
│  Build a shutdown ritual for your    │
│  workday                             │
│                                      │
│  Completed today 🎉  🔥 streak: 7   │
└──────────────────────────────────────┘
```

**Implementation difficulty: LOW-MEDIUM ⬇️⬡**
- No special permissions
- Data: Current task title + description + completion status
- Deep link: Widget tap → `nextthing://journey/checkin`
- SwiftUI: ~100 lines
- Timeline: Update on app foreground + after check-in

---

## Implementation Architecture

### All Widgets Share This Foundation

```
apps/mobile/
├── ios/
│   ├── WidgetExtension/
│   │   ├── WidgetExtension.swift          # @main WidgetBundle entry point
│   │   ├── StreakProgressWidget.swift      # Widget 1: Streak + Progress Ring
│   │   ├── ToolkitStrategyWidget.swift     # Widget 2: Strategy Card
│   │   ├── GatewayStatsWidget.swift        # Widget 3: Open counts
│   │   ├── TodayTaskWidget.swift           # Widget 6: Today's task
│   │   ├── SharedDataProvider.swift        # Reads from App Group UserDefaults
│   │   ├── Assets.xcassets/               # Widget preview images
│   │   ├── Info.plist
│   │   └── WidgetExtension.entitlements   # App Group entitlement
│   │
│   ├── AppGroupData/                      # Shared with main app + gateway extensions
│   │   └── SharedDefaults.swift           # UserDefaults(suiteName: "group.app.nextthing")
```

### Data Flow

```
Main App (React Native)
  → useWidgetData hook (computes snapshot on app foreground + after mutations)
  → Native module: WidgetDataBridge.swift
    → Writes JSON to UserDefaults(suiteName: "group.app.nextthing")
    → Calls WidgetCenter.shared.reloadAllTimelines()

Widget Extension (SwiftUI)
  → TimelineProvider reads from shared UserDefaults
  → Decodes JSON → renders SwiftUI views
  → WidgetKit handles refresh schedule
```

### Shared Data Contract

```swift
struct WidgetData: Codable {
    // Streak + Progress (Widget 1)
    var streakCount: Int
    var completedCount: Int
    var totalTasks: Int
    var currentTaskTitle: String?
    var currentTaskDay: Int?

    // Toolkit Strategy (Widget 2)
    var toolkitStrategy: ToolkitStrategySnapshot?

    // Gateway Stats (Widget 3)
    var gatewayStats: [AppOpenStat]?

    // Today's Task (Widget 6)
    var todayTaskCompleted: Bool
    var todayTaskDescription: String?

    // General
    var lastUpdated: Date
}

struct ToolkitStrategySnapshot: Codable {
    var taskTitle: String
    var taskOrder: Int
    var taskBody: String       // first 300 chars
    var identityFrame: String? // "I am someone who..."
}

struct AppOpenStat: Codable {
    var appId: String
    var appName: String
    var openCount: Int
    var dailyLimit: Int
}
```

This is **~500 bytes** of JSON. Well within UserDefaults limits.

### Native Module: WidgetDataBridge

```swift
// ios/NativeModules/WidgetDataBridge/WidgetDataBridge.swift
import WidgetKit

@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {

    @objc func updateWidgetData(_ jsonString: String) {
        let defaults = UserDefaults(suiteName: "group.app.nextthing")
        defaults?.set(jsonString, forKey: "widget_data")

        // Tell WidgetKit to refresh
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
```

### React Native Hook

```ts
// hooks/useWidgetSync.ts
import { NativeModules } from "react-native";

const { WidgetDataBridge } = NativeModules;

export function useWidgetSync() {
  const { data: state } = useJourneyState();
  const { keepItems } = useToolkit();
  const gatewayStrategy = useGatewayStrategy();

  useEffect(() => {
    if (!state) return;

    const widgetData = {
      streakCount: state.streakCount,
      completedCount: state.tasks.filter(t => t.isCompleted).length,
      totalTasks: state.tasks.length,
      currentTaskTitle: state.currentTask?.task.title ?? null,
      currentTaskDay: state.currentTask?.task.order ?? null,
      todayTaskCompleted: Boolean(state.currentTask === null && state.nextUnlockDate),
      todayTaskDescription: state.currentTask?.task.task_body.slice(0, 300) ?? null,
      toolkitStrategy: gatewayStrategy ? {
        taskTitle: gatewayStrategy.task.title,
        taskOrder: gatewayStrategy.task.order,
        taskBody: gatewayStrategy.task.task_body.slice(0, 300),
      } : null,
      lastUpdated: new Date().toISOString(),
    };

    WidgetDataBridge?.updateWidgetData(JSON.stringify(widgetData));
  }, [state, keepItems, gatewayStrategy]);
}
```

Called once in the root layout or app entry point. Updates widgets whenever journey state changes.

### Timeline Provider (Example: Streak Widget)

```swift
struct StreakProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry(date: Date(), streakCount: 5, completed: 12, total: 30, taskTitle: "Loading...")
    }

    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> Void) {
        let entry = loadEntry()
        // Refresh in 1 hour, or when app explicitly reloads
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntry() -> StreakEntry {
        let defaults = UserDefaults(suiteName: "group.app.nextthing")
        guard let jsonString = defaults?.string(forKey: "widget_data"),
              let data = jsonString.data(using: .utf8),
              let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) else {
            return StreakEntry(date: Date(), streakCount: 0, completed: 0, total: 30, taskTitle: nil)
        }

        return StreakEntry(
            date: Date(),
            streakCount: widgetData.streakCount,
            completed: widgetData.completedCount,
            total: widgetData.totalTasks,
            taskTitle: widgetData.currentTaskTitle
        )
    }
}
```

---

## Permission & Approval Hurdles

| Widget | Apple Entitlement | Special Permission | App Review Risk |
|--------|------------------|--------------------|-----------------|
| **Streak + Progress** | None | App Group only | 🟢 None |
| **Toolkit Strategy** | None | App Group only | 🟢 None |
| **Gateway Stats** | None | App Group only | 🟢 None |
| **Doom Scroll Timer** | `family-controls` | FamilyControls + ActivityKit | 🔴 High — background Live Activity from extension |
| **Daily Quote** | None | None (data is static) | 🟢 None |
| **Today's Task** | None | App Group only | 🟢 None |

### Common requirements for ALL widgets:

1. **App Group entitlement** — needed to share data between main app and widget extension. This is a standard entitlement, auto-approved, no Apple review.
   ```
   group.app.nextthing
   ```

2. **Expo Config Plugin** — WidgetKit extensions can't be auto-generated by Expo. Need a config plugin that:
   - Adds the WidgetExtension target to Xcode project
   - Configures App Group entitlement on both main app and extension
   - Copies Swift source files into the build
   - Sets the extension bundle ID (`app.nextthing.mobile.widget`)

   There are community plugins for this: [`react-native-widget-extension`](https://github.com/nicklama/react-native-widget-extension) and [`expo-apple-targets`](https://github.com/nicklama/expo-apple-targets). Both work with EAS Build.

3. **SwiftUI only** — no React Native in widgets. All widget UI is native Swift. This is a firm Apple limitation.

4. **No network in widgets** — widgets cannot make HTTP requests reliably. All data must be pre-cached by the main app in shared UserDefaults. The main app acts as the "data pump."

5. **Memory limit: 30MB** for widget extensions. Our data is ~500 bytes so this is a non-issue.

6. **Refresh limits** — WidgetKit allows ~40-70 timeline refreshes per day. Our explicit refreshes (after check-in, on foreground) will use ~5-10 of these. Plenty of budget.

---

## Recommendation for V1

### Ship first: **Streak + Progress Ring** (Widget 1) + **Today's Task** (Widget 6)

**Rationale:**
- Both are **low difficulty** — simple SwiftUI, minimal data, no special permissions beyond App Group
- They cover the two most important ADHD needs: **visual progress cue** (streak/ring) and **task externalization** (today's task visible without opening app)
- They share the same data pipeline (WidgetData → SharedDefaults → TimelineProvider)
- Building them also establishes the entire widget infrastructure (App Group, native module, config plugin, data sync hook) that all future widgets reuse
- The Toolkit Strategy widget (Widget 2) becomes trivial to add once the infra is in place

### Ship second: **Toolkit Strategy Card** (Widget 2)

Once the widget infra is in place, this is ~150 lines of SwiftUI and a few extra fields in WidgetData. It's the most ADHD-valuable widget long-term (passive spaced repetition on the Home Screen).

### Defer: **Gateway Stats** (Widget 3) and **Doom Scroll Timer** (Widget 4)

Both depend on the Mindful Gateway being active. Build them as part of the Gateway phases.

### Skip or defer: **Daily Quote** (Widget 5)

Low value. Every motivational app has one. Doesn't differentiate us. Build only if users request it.

---

## Implementation Timeline

### Phase A: Widget Infrastructure — 3-4 days (can parallel with other work)

1. **App Group setup** — Add `group.app.nextthing` to main app entitlements
2. **WidgetDataBridge.swift** — Native module to write JSON to shared UserDefaults
3. **useWidgetSync.ts** — React Native hook to push data on state changes
4. **Expo config plugin** — Add WidgetExtension target to Xcode project
5. **SharedDefaults.swift** — Codable data contract

### Phase B: First Widgets — 2-3 days

1. **StreakProgressWidget.swift** — Small + Medium sizes
2. **TodayTaskWidget.swift** — Medium size
3. **Widget previews** — Xcode preview images for widget gallery
4. **Lock Screen widget** — Circular streak badge (inline accessory)

### Phase C: Toolkit Widget — 1-2 days (after toolkit feature is live)

1. **ToolkitStrategyWidget.swift** — Medium + Large sizes
2. **SR-based strategy snapshot** — Pre-compute in useWidgetSync

### Phase D: Gateway Widgets — done during Gateway phases

1. **GatewayStatsWidget.swift** — After Open Limits is implemented
2. **DoomScrollLiveActivity** — After FamilyControls is approved (Phase 2 of Gateway)

---

## StandBy Mode (iOS 17+)

Widgets automatically work in StandBy mode (when iPhone is horizontal on a charger). The streak/progress widget and toolkit strategy card are particularly good here — the user sees their ADHD strategies passively while their phone charges on their desk. No extra code needed; WidgetKit handles StandBy rendering.

---

## Lock Screen Widgets (iOS 16+)

Three accessory types:

| Type | Use case | Our widget |
|------|----------|------------|
| **Accessory Circular** | Small circle, like a watch complication | 🔥 Streak count |
| **Accessory Rectangular** | Medium rectangle, ~4 lines of text | Today's task title + status |
| **Accessory Inline** | Single line of text above the clock | "🔥 7 | Day 12/30" |

Lock Screen widgets use the same TimelineProvider as Home Screen widgets. The only extra work is providing a separate SwiftUI view for each accessory family. ~30 lines each.

**No additional permissions needed.**

---

## Performance Notes

- **Widget rendering:** SwiftUI views are rendered once by WidgetKit and displayed as a snapshot. No continuous rendering, no animation, no gesture handling. Essentially zero CPU/GPU cost.
- **Data sync cost:** One JSON write (~500 bytes) to UserDefaults on app foreground + after mutations. Negligible.
- **Timeline refresh cost:** WidgetKit budgets ~40-70 refreshes/day. We use ~5-10. No concern.
- **Battery impact:** Widgets are the most battery-efficient UI in iOS. Apple designed them specifically for this.
- **Memory:** Widget extension limit is 30MB. Our extension uses <1MB.

---

## Open Questions

1. **Community widget (`react-native-widget-extension` vs `expo-apple-targets`)** — which Expo config plugin to use? `expo-apple-targets` by Evan Bacon (Expo team) is more maintained but more opinionated. `react-native-widget-extension` is simpler. Need to test both with our EAS Build profile.

2. **Widget intent configuration** — iOS 17 introduced interactive widgets (buttons, toggles). We could add a "Mark as done" button directly on the Today's Task widget. This requires `AppIntents` framework and a separate Swift `AppIntentsExtension`. Worth exploring but adds complexity — defer to Phase C or later.

3. **Widget gallery screenshots** — Apple requires preview images for the widget picker. Need to design these in Figma and export as assets. Not a code blocker, but a design task.
