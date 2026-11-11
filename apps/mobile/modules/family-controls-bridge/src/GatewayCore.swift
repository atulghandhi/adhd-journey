import DeviceActivity
import Foundation
import ManagedSettings

// Shared App Disrupt logic.
//
// This single file is compiled into FOUR targets: the app (through the
// FamilyControlsBridge pod) and the ShieldConfig, ShieldAction and
// DeviceActivityMonitor extensions (the withFamilyControls config plugin
// copies it into each extension at prebuild). Everything they need to agree
// on lives here: the App Group keys, the config the JS side syncs, the pause
// maths, and the one function that decides what is shielded right now.
//
// Keep it free of UIKit, SwiftUI and ExpoModulesCore.

@available(iOS 16.0, *)
enum GatewayKeys {
    static let appGroup = "group.app.nextthing"

    // The user's selection (JSON-encoded token arrays).
    static let shieldedApps = "shielded_app_tokens"
    static let shieldedCategories = "shielded_category_tokens"

    // Settings synced from JS (JSON string, see GatewayConfig).
    static let config = "gateway_config_v2"

    // In-shield pause: epoch seconds when the breathing pause completes.
    static let breathUntil = "gateway_breath_until"
    static let breathSeconds = "gateway_breath_seconds"

    // Unlock session: epoch seconds when the shield comes back.
    static let unlockUntil = "gateway_unlock_until"

    // What the user was trying to open ("app" | "category" | "all").
    static let targetKind = "gateway_target_kind"
    static let targetToken = "gateway_target_token"
    static let targetName = "gateway_target_name"
    static let targetBundleId = "gateway_target_bundle_id"

    // Written by the ShieldConfig extension when it draws a shield, so the
    // ShieldAction extension (which only receives an opaque token) can pass
    // the app's name and bundle id along.
    static let shownName = "gateway_shown_name"
    static let shownBundleId = "gateway_shown_bundle_id"
    static let shownAt = "gateway_shown_at"

    // Hand-off to the main app. `pendingAt` is the request the app consumes;
    // `handoffAt` stays set until the app confirms it opened.
    static let pendingAt = "gateway_pending_at"
    static let handoffAt = "gateway_handoff_at"

    // Daily open counter.
    static let opensCount = "gateway_opens_count"
    static let opensDay = "gateway_opens_day"

    // One-off message for the next shield ("session" | "checkin:<minutes>").
    static let notice = "gateway_notice"
    static let noticeAt = "gateway_notice_at"

    // Bookkeeping for the daily DeviceActivity monitor.
    static let monitorSignature = "gateway_monitor_signature"
    static let monitorStartedAt = "gateway_monitor_started_at"
}

/// Settings written by the JS side through `syncGateway`.
@available(iOS 16.0, *)
struct GatewayConfig: Decodable {
    var enabled = false
    var pauseSeconds: Double = 5
    var frictionStepSeconds: Double = 0
    var frictionCapSeconds: Double = 20
    var sessionMinutes = 5
    /// "guided" hands off to the app's breathing screen, "quick" keeps the
    /// pause on the shield itself.
    var style = "guided"
    /// Minutes of use (per day) after which the shield returns as a check-in.
    var checkInMinutes: [Int] = []

    private enum CodingKeys: String, CodingKey {
        case enabled, pauseSeconds, frictionStepSeconds, frictionCapSeconds
        case sessionMinutes, style, checkInMinutes
    }

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        enabled = (try? c.decodeIfPresent(Bool.self, forKey: .enabled)) ?? false
        pauseSeconds = (try? c.decodeIfPresent(Double.self, forKey: .pauseSeconds)) ?? 5
        frictionStepSeconds =
            (try? c.decodeIfPresent(Double.self, forKey: .frictionStepSeconds)) ?? 0
        frictionCapSeconds =
            (try? c.decodeIfPresent(Double.self, forKey: .frictionCapSeconds)) ?? 20
        sessionMinutes = (try? c.decodeIfPresent(Int.self, forKey: .sessionMinutes)) ?? 5
        style = (try? c.decodeIfPresent(String.self, forKey: .style)) ?? "guided"
        checkInMinutes = (try? c.decodeIfPresent([Int].self, forKey: .checkInMinutes)) ?? []
    }
}

@available(iOS 16.0, *)
enum GatewayCore {
    static let sessionActivity = DeviceActivityName("gateway_session_end")
    static let dailyActivity = DeviceActivityName("gateway_doom_scroll")
    static let checkInEventPrefix = "gateway_checkin_"

    /// After the in-shield pause completes, how long "Continue" stays valid.
    static let readyGraceSeconds: TimeInterval = 120
    /// How long a hand-off request waits for the app before the shield offers
    /// the in-shield pause instead.
    static let handoffWindowSeconds: TimeInterval = 120
    /// How long a pending request stays valid for the app to pick up.
    static let pendingWindowSeconds: TimeInterval = 180

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: GatewayKeys.appGroup)
    }

    static var now: TimeInterval {
        Date().timeIntervalSince1970
    }

    // MARK: - Config

    static func loadConfig() -> GatewayConfig {
        guard let json = defaults?.string(forKey: GatewayKeys.config),
              let data = json.data(using: .utf8),
              let config = try? JSONDecoder().decode(GatewayConfig.self, from: data)
        else {
            return GatewayConfig()
        }
        return config
    }

    /// The pause for the next open: the base pause plus progressive friction
    /// for every open earlier today, capped. Mirrors
    /// `computeShieldPauseSeconds` in packages/shared.
    static func pauseSeconds(config: GatewayConfig, opensSoFar: Int) -> Double {
        let base = min(max(config.pauseSeconds, 1), 60)
        guard config.frictionStepSeconds > 0 else { return base }
        let cap = max(config.frictionCapSeconds, base)
        return min(base + config.frictionStepSeconds * Double(max(opensSoFar, 0)), cap)
    }

    // MARK: - Selection

    // The selection was historically written either as an ordered Array or as
    // a Set. Both decode from the same JSON array, so try the array first.
    static func loadApps() -> [ApplicationToken] {
        guard let data = defaults?.data(forKey: GatewayKeys.shieldedApps) else { return [] }
        if let array = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            return array
        }
        if let set = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data) {
            return Array(set)
        }
        return []
    }

    static func loadCategories() -> [ActivityCategoryToken] {
        guard let data = defaults?.data(forKey: GatewayKeys.shieldedCategories) else { return [] }
        if let array = try? JSONDecoder().decode([ActivityCategoryToken].self, from: data) {
            return array
        }
        if let set = try? JSONDecoder().decode(Set<ActivityCategoryToken>.self, from: data) {
            return Array(set)
        }
        return []
    }

    static func saveApps(_ apps: [ApplicationToken]) {
        if let data = try? JSONEncoder().encode(apps) {
            defaults?.set(data, forKey: GatewayKeys.shieldedApps)
        }
    }

    static func saveCategories(_ categories: [ActivityCategoryToken]) {
        if let data = try? JSONEncoder().encode(categories) {
            defaults?.set(data, forKey: GatewayKeys.shieldedCategories)
        }
    }

    static func selectionCount() -> Int {
        loadApps().count + loadCategories().count
    }

    // MARK: - Daily open counter

    static func dayKey(_ date: Date = Date()) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    static func opensToday() -> Int {
        guard let d = defaults, d.string(forKey: GatewayKeys.opensDay) == dayKey() else {
            return 0
        }
        return d.integer(forKey: GatewayKeys.opensCount)
    }

    @discardableResult
    static func recordOpen() -> Int {
        let next = opensToday() + 1
        defaults?.set(next, forKey: GatewayKeys.opensCount)
        defaults?.set(dayKey(), forKey: GatewayKeys.opensDay)
        return next
    }

    // MARK: - Unlock session

    /// Epoch seconds when the current unlock session ends, or 0 if none.
    static func unlockUntil() -> TimeInterval {
        let until = defaults?.double(forKey: GatewayKeys.unlockUntil) ?? 0
        return until > now ? until : 0
    }

    static func isUnlocked() -> Bool {
        unlockUntil() > 0
    }

    /// Remember which app (or category) the user is trying to open, so the
    /// unlock only lifts the shield for that one.
    static func setTarget(kind: String, tokenData: Data?) {
        guard let d = defaults else { return }
        d.set(kind, forKey: GatewayKeys.targetKind)
        if let tokenData {
            d.set(tokenData, forKey: GatewayKeys.targetToken)
        } else {
            d.removeObject(forKey: GatewayKeys.targetToken)
        }

        // Carry over the name / bundle id the ShieldConfig extension saw when
        // it drew this shield, if that was recent.
        let shownAt = d.double(forKey: GatewayKeys.shownAt)
        if shownAt > 0, now - shownAt < 15 * 60 {
            setOrRemove(d.string(forKey: GatewayKeys.shownName), GatewayKeys.targetName)
            setOrRemove(d.string(forKey: GatewayKeys.shownBundleId), GatewayKeys.targetBundleId)
        } else {
            d.removeObject(forKey: GatewayKeys.targetName)
            d.removeObject(forKey: GatewayKeys.targetBundleId)
        }
    }

    private static func setOrRemove(_ value: String?, _ key: String) {
        if let value, !value.isEmpty {
            defaults?.set(value, forKey: key)
        } else {
            defaults?.removeObject(forKey: key)
        }
    }

    /// The single source of truth for what is shielded right now: the user's
    /// selection, minus whatever the current unlock session lifted, or
    /// nothing at all when App Disrupt is switched off.
    static func applyShields(store: ManagedSettingsStore) {
        let config = loadConfig()
        var apps = Set(loadApps())
        var categories = Set(loadCategories())
        var exemptApps = Set<ApplicationToken>()

        // A leftover hard block would show iOS's generic "Restricted" screen
        // instead of our shield.
        store.application.blockedApplications = nil

        guard config.enabled, !(apps.isEmpty && categories.isEmpty) else {
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            return
        }

        if isUnlocked() {
            let kind = defaults?.string(forKey: GatewayKeys.targetKind) ?? "all"
            let data = defaults?.data(forKey: GatewayKeys.targetToken)
            var lifted = false

            if kind == "app", let data,
               let token = try? JSONDecoder().decode(ApplicationToken.self, from: data) {
                apps.remove(token)
                exemptApps.insert(token)
                lifted = true
            } else if kind == "category", let data,
                      let token = try? JSONDecoder().decode(ActivityCategoryToken.self, from: data) {
                categories.remove(token)
                lifted = true
            }

            if !lifted {
                apps.removeAll()
                categories.removeAll()
            }
        }

        store.shield.applications = apps.isEmpty ? nil : apps
        store.shield.applicationCategories =
            categories.isEmpty ? nil : .specific(categories, except: exemptApps)
    }

    /// Lift the shield for the target app for the configured session length,
    /// count the open, and schedule the shield's return.
    @discardableResult
    static func beginSession(store: ManagedSettingsStore) -> TimeInterval {
        let config = loadConfig()
        let minutes = min(max(config.sessionMinutes, 1), 120)
        let until = now + Double(minutes * 60)

        if let d = defaults {
            d.set(until, forKey: GatewayKeys.unlockUntil)
            d.removeObject(forKey: GatewayKeys.breathUntil)
            d.removeObject(forKey: GatewayKeys.breathSeconds)
            d.removeObject(forKey: GatewayKeys.pendingAt)
            d.removeObject(forKey: GatewayKeys.handoffAt)
            d.removeObject(forKey: GatewayKeys.notice)
            d.removeObject(forKey: GatewayKeys.noticeAt)
        }

        recordOpen()
        applyShields(store: store)
        scheduleReshield(at: Date(timeIntervalSince1970: until))
        return until
    }

    /// End the unlock session (if any) and put every shield back. `notice`
    /// is shown on the shield that reappears.
    static func endSession(store: ManagedSettingsStore, notice: String?) {
        if let d = defaults {
            d.removeObject(forKey: GatewayKeys.unlockUntil)
            d.removeObject(forKey: GatewayKeys.breathUntil)
            d.removeObject(forKey: GatewayKeys.breathSeconds)
            if let notice {
                d.set(notice, forKey: GatewayKeys.notice)
                d.set(now, forKey: GatewayKeys.noticeAt)
            }
        }
        applyShields(store: store)
    }

    /// Ask DeviceActivity to wake the monitor extension when the session
    /// ends. Intervals must be at least 15 minutes long, so the interval
    /// *starts* at the moment the shield should return (the monitor
    /// re-shields in `intervalDidStart`) and simply runs for 30 minutes.
    static func scheduleReshield(at date: Date) {
        let center = DeviceActivityCenter()
        let calendar = Calendar.current
        let parts: Set<Calendar.Component> = [.hour, .minute, .second]
        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents(parts, from: date),
            intervalEnd: calendar.dateComponents(parts, from: date.addingTimeInterval(30 * 60)),
            repeats: false,
            warningTime: nil
        )

        center.stopMonitoring([sessionActivity])
        do {
            try center.startMonitoring(sessionActivity, during: schedule, events: [:])
        } catch {
            // Fallbacks still apply: the app re-shields whenever it comes to
            // the foreground, and so do the daily monitor's callbacks.
            NSLog("[Gateway] scheduleReshield failed: %@", "\(error)")
        }
    }

    // MARK: - Daily monitor (midnight re-apply + usage check-ins)

    /// Keep the repeating daily monitor in line with the settings. It is only
    /// restarted when something it depends on changed, because restarting
    /// resets the usage counted toward the check-in thresholds.
    static func syncDailyMonitor() {
        let center = DeviceActivityCenter()
        let config = loadConfig()
        let apps = Set(loadApps())
        let categories = Set(loadCategories())
        let wanted = config.enabled && !(apps.isEmpty && categories.isEmpty)

        guard wanted else {
            center.stopMonitoring([dailyActivity, sessionActivity])
            defaults?.removeObject(forKey: GatewayKeys.monitorSignature)
            return
        }

        let minutes = Array(Set(config.checkInMinutes.filter { $0 > 0 })).sorted()
        let signature = "\(minutes)|\(selectionFingerprint())"
        let running = center.activities.contains(dailyActivity)
        if running, defaults?.string(forKey: GatewayKeys.monitorSignature) == signature {
            return
        }

        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for minute in minutes {
            events[DeviceActivityEvent.Name("\(checkInEventPrefix)\(minute)")] =
                DeviceActivityEvent(
                    applications: apps,
                    categories: categories,
                    webDomains: [],
                    threshold: DateComponents(minute: minute)
                )
        }

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true,
            warningTime: nil
        )

        center.stopMonitoring([dailyActivity])
        do {
            try center.startMonitoring(dailyActivity, during: schedule, events: events)
            defaults?.set(signature, forKey: GatewayKeys.monitorSignature)
            defaults?.set(now, forKey: GatewayKeys.monitorStartedAt)
        } catch {
            defaults?.removeObject(forKey: GatewayKeys.monitorSignature)
            NSLog("[Gateway] syncDailyMonitor failed: %@", "\(error)")
        }
    }

    /// A fingerprint of the selection that is stable across launches (Swift's
    /// own hash values are randomised per process).
    private static func selectionFingerprint() -> String {
        var hash: UInt64 = 0xcbf2_9ce4_8422_2325
        for key in [GatewayKeys.shieldedApps, GatewayKeys.shieldedCategories] {
            guard let data = defaults?.data(forKey: key) else { continue }
            for byte in data {
                hash ^= UInt64(byte)
                hash = hash &* 0x0000_0100_0000_01b3
            }
        }
        return String(hash, radix: 16)
    }

    // MARK: - Token helpers shared with the JS bridge

    /// Tokens travel to JS as "app:<base64>" / "category:<base64>".
    static func encodeForJS(kind: String, tokenData: Data?) -> String? {
        guard let tokenData, kind == "app" || kind == "category" else { return nil }
        return "\(kind):\(tokenData.base64EncodedString())"
    }
}
