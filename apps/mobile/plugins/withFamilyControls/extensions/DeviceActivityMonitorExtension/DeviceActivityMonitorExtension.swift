import DeviceActivity
import ManagedSettings
import Foundation
import os.log

private let appGroupID = "group.app.nextthing"
private let shieldedAppsKey = "shielded_app_tokens"
private let doomScrollCountKey = "doom_scroll_count"

class AppDisruptDeviceActivityMonitor: DeviceActivityMonitor {
    private let store = ManagedSettingsStore()

    // Called when a monitored usage threshold is reached
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        os_log("[DeviceActivityMonitor] eventDidReachThreshold: %{public}s for activity %{public}s", log: OSLog.default, type: .default, event.rawValue, activity.rawValue)
        let sharedDefaults = UserDefaults(suiteName: appGroupID)

        // Clear everything first — prevents leftover blockedApplications
        // from causing the generic "Restricted" UI instead of our shield.
        store.clearAllSettings()
        os_log("[DeviceActivityMonitor] Cleared all settings", log: OSLog.default, type: .default)

        // Re-apply shields to force user through breathing pause
        if let data = sharedDefaults?.data(forKey: shieldedAppsKey),
           let tokens = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            store.shield.applications = Set(tokens)
            os_log("[DeviceActivityMonitor] Re-applied %d app shields", log: OSLog.default, type: .default, tokens.count)
        }
        if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
           let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
            store.shield.applicationCategories = .specific(Set(catTokens))
            os_log("[DeviceActivityMonitor] Re-applied %d category shields", log: OSLog.default, type: .default, catTokens.count)
        }

        // Increment doom-scroll counter for escalating messages
        let sessionCount = (sharedDefaults?.integer(forKey: doomScrollCountKey) ?? 0) + 1
        sharedDefaults?.set(sessionCount, forKey: doomScrollCountKey)
    }

    override func intervalDidStart(for activity: DeviceActivityName) {
        os_log("[DeviceActivityMonitor] intervalDidStart for activity %{public}s", log: OSLog.default, type: .default, activity.rawValue)
        let sharedDefaults = UserDefaults(suiteName: appGroupID)
        sharedDefaults?.set(0, forKey: doomScrollCountKey)

        // Clear everything first — prevents leftover blockedApplications
        // from causing the generic "Restricted" UI instead of our shield.
        store.clearAllSettings()
        os_log("[DeviceActivityMonitor] Cleared all settings (interval start)", log: OSLog.default, type: .default)

        // Reapply shields at start of new day so protection carries over
        if let data = sharedDefaults?.data(forKey: shieldedAppsKey),
           let tokens = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            store.shield.applications = Set(tokens)
            os_log("[DeviceActivityMonitor] intervalDidStart: Re-applied %d app shields", log: OSLog.default, type: .default, tokens.count)
        }
        if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
           let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
            store.shield.applicationCategories = .specific(Set(catTokens))
            os_log("[DeviceActivityMonitor] intervalDidStart: Re-applied %d category shields", log: OSLog.default, type: .default, catTokens.count)
        }
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        os_log("[DeviceActivityMonitor] intervalDidEnd for activity %{public}s", log: OSLog.default, type: .default, activity.rawValue)
        // Interval end is followed immediately by intervalDidStart (repeating schedule),
        // so shields are reapplied there. No need to remove here.
    }

    override func eventWillReachThresholdWarning(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        os_log("[DeviceActivityMonitor] eventWillReachThresholdWarning: %{public}s for activity %{public}s", log: OSLog.default, type: .default, event.rawValue, activity.rawValue)
        // No-op: we rely on the actual threshold, not the warning
    }
}
