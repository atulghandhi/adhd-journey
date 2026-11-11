import DeviceActivity
import Foundation
import ManagedSettings

// Runs in the background (no app needed) to put shields back:
//  - when an unlock session ends,
//  - when a usage check-in threshold is reached,
//  - at the start of each day.
//
// The shield logic itself lives in GatewayCore.swift, which the config plugin
// copies into this target.
class AppDisruptDeviceActivityMonitor: DeviceActivityMonitor {
    private let store = ManagedSettingsStore()

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        if activity == GatewayCore.sessionActivity {
            // The session-end schedule starts at the moment the shield is due
            // back (see GatewayCore.scheduleReshield).
            GatewayCore.endSession(store: store, notice: "session")
            DeviceActivityCenter().stopMonitoring([GatewayCore.sessionActivity])
            return
        }

        if activity == GatewayCore.dailyActivity {
            // New day (or the monitor was just started). Re-assert the
            // shields without cutting an active session short.
            GatewayCore.applyShields(store: store)
        }
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        if activity == GatewayCore.sessionActivity, !GatewayCore.isUnlocked() {
            GatewayCore.applyShields(store: store)
        }
    }

    // A usage check-in: the user has spent N minutes in their paused apps
    // today, so bring the shield back for a moment of choice.
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)

        guard activity == GatewayCore.dailyActivity,
              event.rawValue.hasPrefix(GatewayCore.checkInEventPrefix)
        else { return }

        // iOS sometimes reports thresholds the moment monitoring starts.
        // Nobody has used an app for 10 minutes within a minute of starting.
        let startedAt = GatewayCore.defaults?.double(forKey: GatewayKeys.monitorStartedAt) ?? 0
        if startedAt > 0, GatewayCore.now - startedAt < 60 {
            return
        }

        let minutes = String(event.rawValue.dropFirst(GatewayCore.checkInEventPrefix.count))
        // Only interrupt (and explain why) when a session is actually open.
        // Otherwise the shield is already up and will say its usual piece.
        if GatewayCore.isUnlocked() {
            GatewayCore.endSession(store: store, notice: "checkin:\(minutes)")
            DeviceActivityCenter().stopMonitoring([GatewayCore.sessionActivity])
        } else {
            GatewayCore.applyShields(store: store)
        }
    }
}
