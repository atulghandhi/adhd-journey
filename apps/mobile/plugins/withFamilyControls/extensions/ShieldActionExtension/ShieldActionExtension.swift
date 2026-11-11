import Foundation
import ManagedSettings
import UserNotifications

// Handles taps on the shield's two buttons.
//
// Primary button, in order of preference:
//  1. Guided pause on iOS 26.5+: ask iOS to open Next Thing, which runs the
//     animated breathing countdown and then lifts the shield.
//  2. Guided pause on older iOS: post a notification the user taps to get to
//     the same screen (extensions could not open their app before 26.5).
//  3. Quick pause, or whenever the hand-off did not happen: a timed pause on
//     the shield itself. First tap starts it, a second tap after it completes
//     lifts the shield.
//
// Secondary button: close the app.
//
// Shared state and the shield maths live in GatewayCore.swift, which the
// config plugin copies into this target.
class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore()

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(
            to: action,
            kind: "app",
            tokenData: try? JSONEncoder().encode(application),
            completionHandler: completionHandler
        )
    }

    // Apps shielded through a selected *category* arrive here.
    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(
            to: action,
            kind: "category",
            tokenData: try? JSONEncoder().encode(category),
            completionHandler: completionHandler
        )
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(to: action, kind: "all", tokenData: nil, completionHandler: completionHandler)
    }

    // MARK: - Shared handling

    private func respond(
        to action: ShieldAction,
        kind: String,
        tokenData: Data?,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            handlePrimary(kind: kind, tokenData: tokenData, completionHandler: completionHandler)
        case .secondaryButtonPressed:
            // "I don't need it": drop any pause in progress and close the app.
            let defaults = GatewayCore.defaults
            defaults?.removeObject(forKey: GatewayKeys.breathUntil)
            defaults?.removeObject(forKey: GatewayKeys.breathSeconds)
            defaults?.removeObject(forKey: GatewayKeys.handoffAt)
            defaults?.removeObject(forKey: GatewayKeys.pendingAt)
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }

    private func handlePrimary(
        kind: String,
        tokenData: Data?,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        let defaults = GatewayCore.defaults
        let now = GatewayCore.now
        let config = GatewayCore.loadConfig()

        // Already unlocked for exactly this app (the shield can linger for a
        // moment after it is lifted): re-assert and let the user through
        // rather than starting a second pause.
        if GatewayCore.isUnlocked(),
           defaults?.string(forKey: GatewayKeys.targetKind) == kind,
           defaults?.data(forKey: GatewayKeys.targetToken) == tokenData {
            GatewayCore.applyShields(store: store)
            completionHandler(.none)
            return
        }

        GatewayCore.setTarget(kind: kind, tokenData: tokenData)

        // An in-shield pause is already running or has just completed.
        let breathUntil = defaults?.double(forKey: GatewayKeys.breathUntil) ?? 0
        if breathUntil > 0, now <= breathUntil + GatewayCore.readyGraceSeconds {
            if now < breathUntil {
                // Tapped early: redraw so the remaining time updates.
                completionHandler(.defer)
                return
            }
            GatewayCore.beginSession(store: store)
            completionHandler(.none)
            return
        }

        if config.style != "quick" {
            // If an earlier hand-off is still unanswered, the app never
            // opened. Fall through to the in-shield pause instead of
            // stranding the user.
            let lastHandoff = defaults?.double(forKey: GatewayKeys.handoffAt) ?? 0
            let handoffUnanswered =
                lastHandoff > 0 && now - lastHandoff < GatewayCore.handoffWindowSeconds

            if !handoffUnanswered {
                defaults?.set(now, forKey: GatewayKeys.pendingAt)
                defaults?.set(now, forKey: GatewayKeys.handoffAt)

                // iOS 26.5 added ShieldActionResponse.openParentalControlsApp.
                // It is built from its raw value so this file also compiles
                // against SDKs that do not name the case yet. If the value is
                // not recognised, the initialiser returns nil and we carry on
                // to the notification path.
                if #available(iOS 26.5, *), let openApp = ShieldActionResponse(rawValue: 3) {
                    completionHandler(openApp)
                    return
                }

                postHandoffNotification { delivered in
                    if delivered {
                        // Redraw: "Tap the Next Thing notification".
                        completionHandler(.defer)
                    } else {
                        GatewayCore.defaults?.removeObject(forKey: GatewayKeys.pendingAt)
                        GatewayCore.defaults?.removeObject(forKey: GatewayKeys.handoffAt)
                        self.startBreathing(config: config, completionHandler: completionHandler)
                    }
                }
                return
            }
        }

        startBreathing(config: config, completionHandler: completionHandler)
    }

    /// Start the timed pause on the shield itself and redraw it.
    private func startBreathing(
        config: GatewayConfig,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        let defaults = GatewayCore.defaults
        let pause = GatewayCore.pauseSeconds(
            config: config, opensSoFar: GatewayCore.opensToday())

        defaults?.removeObject(forKey: GatewayKeys.pendingAt)
        defaults?.removeObject(forKey: GatewayKeys.handoffAt)
        defaults?.set(pause, forKey: GatewayKeys.breathSeconds)
        defaults?.set(GatewayCore.now + pause, forKey: GatewayKeys.breathUntil)
        completionHandler(.defer)
    }

    /// Older iOS cannot open the app from a shield, so offer a notification
    /// the user taps to get to the breathing screen.
    private func postHandoffNotification(completion: @escaping (Bool) -> Void) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized
                    || settings.authorizationStatus == .provisional
            else {
                completion(false)
                return
            }

            let content = UNMutableNotificationContent()
            content.title = "Take a breath first"
            content.body = "Tap to start your pause in Next Thing."

            let request = UNNotificationRequest(
                identifier: "gateway-handoff",
                content: content,
                trigger: nil
            )
            center.add(request) { error in
                completion(error == nil)
            }
        }
    }
}
