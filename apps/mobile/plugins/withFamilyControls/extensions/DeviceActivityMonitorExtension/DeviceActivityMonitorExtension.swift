import DeviceActivity
import ManagedSettings
import Foundation

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
        let sharedDefaults = UserDefaults(suiteName: appGroupID)

        // Clear everything first — prevents leftover blockedApplications
        // from causing the generic "Restricted" UI instead of our shield.
        store.clearAllSettings()

        // Re-apply shields to force user through breathing pause
        if let data = sharedDefaults?.data(forKey: shieldedAppsKey),
           let tokens = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            store.shield.applications = Set(tokens)
        }
        if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
           let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
            store.shield.applicationCategories = .specific(Set(catTokens))
        }

        // Increment doom-scroll counter for escalating messages
        let sessionCount = (sharedDefaults?.integer(forKey: doomScrollCountKey) ?? 0) + 1
        sharedDefaults?.set(sessionCount, forKey: doomScrollCountKey)
    }

    // Called when monitoring interval starts (daily reset at midnight)
    override func intervalDidStart(for activity: DeviceActivityName) {
        let sharedDefaults = UserDefaults(suiteName: appGroupID)
        sharedDefaults?.set(0, forKey: doomScrollCountKey)

        // Clear everything first — prevents leftover blockedApplications
        // from causing the generic "Restricted" UI instead of our shield.
        store.clearAllSettings()

        // Reapply shields at start of new day so protection carries over
        if let data = sharedDefaults?.data(forKey: shieldedAppsKey),
           let tokens = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            store.shield.applications = Set(tokens)
        }
        if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
           let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
            store.shield.applicationCategories = .specific(Set(catTokens))
        }
    }

    // Called when monitoring interval ends
    override func intervalDidEnd(for activity: DeviceActivityName) {
        // Interval end is followed immediately by intervalDidStart (repeating schedule),
        // so shields are reapplied there. No need to remove here.
    }

    // Called when a usage warning threshold is approaching
    override func eventWillReachThresholdWarning(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        // No-op: we rely on the actual threshold, not the warning
    }
}
