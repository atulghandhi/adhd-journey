import Foundation
import ManagedSettings
import ManagedSettingsUI
import os.log

// Keys shared with the main app + other extensions via the App Group.
private let appGroupID = "group.app.nextthing"
private let shieldedAppsKey = "shielded_app_tokens"
private let shieldedCategoriesKey = "shielded_category_tokens"
private let pauseSecondsKey = "gateway_pause_seconds"
private let breathUntilKey = "gateway_breath_until"
private let reapplyAtKey = "gateway_shield_reapply_at"

// How long the user may use the unlocked app before shields come back.
private let unlockWindowSeconds: TimeInterval = 60
// After the breathing pause completes, how long the "ready" state stays valid.
private let readyGraceSeconds: TimeInterval = 120

/// Two-tap mindful unlock:
///  1. "Start breathing" — records when the pause will complete and responds
///     `.defer`, which re-invokes the ShieldConfiguration data source so the
///     shield switches to its breathing state.
///  2. "Continue" — once the user-set pause has elapsed, shields are cleared
///     and `.defer` lets the system dismiss the shield in place, dropping the
///     user straight into the app they tapped. A re-apply deadline is
///     persisted so the main app (and a best-effort timer here) restores the
///     shields after the unlock window.
class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore()

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handleShieldAction(action, context: "application", completionHandler: completionHandler)
    }

    // Apps blocked through a selected *category* invoke this variant — it was
    // previously missing, which left the shield frozen on screen because the
    // button taps were never answered.
    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handleShieldAction(action, context: "category", completionHandler: completionHandler)
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        handleShieldAction(action, context: "webDomain", completionHandler: completionHandler)
    }

    // MARK: - Shared handling

    private func handleShieldAction(
        _ action: ShieldAction,
        context: String,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        os_log("[ShieldActionExtension] handling %{public}@ action for %{public}@", log: OSLog.default, type: .default, "\(action)", context)
        switch action {
        case .primaryButtonPressed:
            handlePrimary(completionHandler: completionHandler)
        case .secondaryButtonPressed:
            // "Go back" — close the shielded app.
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }

    private func handlePrimary(
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        let defaults = UserDefaults(suiteName: appGroupID)
        let now = Date().timeIntervalSince1970
        let breathUntil = defaults?.double(forKey: breathUntilKey) ?? 0

        if breathUntil <= 0 || now > breathUntil + readyGraceSeconds {
            // Stage 1: start the breathing pause using the user's configured
            // duration, then refresh the shield UI into its breathing state.
            var pause = defaults?.double(forKey: pauseSecondsKey) ?? 0
            if pause <= 0 { pause = 5 }
            pause = min(max(pause, 3), 30)

            defaults?.set(now + pause, forKey: breathUntilKey)
            recordPendingDeepLink(defaults)
            os_log("[ShieldActionExtension] breathing started (%{public}.0fs)", log: OSLog.default, type: .default, pause)
            completionHandler(.defer)
            return
        }

        if now < breathUntil {
            // Tapped again before the pause finished — refresh the shield so
            // the remaining-seconds label updates, but keep it up.
            os_log("[ShieldActionExtension] continue tapped early (%{public}.0fs left)", log: OSLog.default, type: .default, breathUntil - now)
            completionHandler(.defer)
            return
        }

        // Stage 2: pause complete — unshield and let the user into the app.
        defaults?.removeObject(forKey: breathUntilKey)
        defaults?.set(now + unlockWindowSeconds, forKey: reapplyAtKey)

        store.clearAllSettings()
        os_log("[ShieldActionExtension] shields cleared, unlock window %{public}.0fs", log: OSLog.default, type: .default, unlockWindowSeconds)

        // Best-effort in-process re-apply. The extension may be terminated
        // before this fires; the main app enforces the persisted deadline as
        // the reliable fallback.
        DispatchQueue.main.asyncAfter(deadline: .now() + unlockWindowSeconds) { [weak self] in
            self?.reapplyShields(defaults)
        }

        completionHandler(.defer)
    }

    private func reapplyShields(_ defaults: UserDefaults?) {
        if let appData = defaults?.data(forKey: shieldedAppsKey),
           let appTokens = try? JSONDecoder().decode([ApplicationToken].self, from: appData),
           !appTokens.isEmpty {
            store.shield.applications = Set(appTokens)
        }
        if let catData = defaults?.data(forKey: shieldedCategoriesKey),
           let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData),
           !catTokens.isEmpty {
            store.shield.applicationCategories = .specific(Set(catTokens))
        }
        defaults?.removeObject(forKey: reapplyAtKey)
        os_log("[ShieldActionExtension] shields re-applied after unlock window", log: OSLog.default, type: .default)
    }

    private func recordPendingDeepLink(_ defaults: UserDefaults?) {
        defaults?.set("disrupt", forKey: "pendingDeepLink")
        defaults?.set(Date().timeIntervalSince1970, forKey: "pendingDeepLinkAt")
    }
}
