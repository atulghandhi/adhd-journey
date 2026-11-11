import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

// Draws the shield iOS shows over a paused app.
//
// A shield is a fixed template: an icon, a title, a subtitle and two buttons.
// iOS does not allow custom views, animation or a live countdown here, so the
// animated breathing pause lives in the Next Thing app and this screen is the
// doorway to it. The text reflects the state shared through the App Group
// (see GatewayCore.swift, which the config plugin copies into this target).

private let brandGreen = UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0)
private let brandBackground = UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0)

class ShieldConfigExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration(
            name: application.localizedDisplayName,
            bundleId: application.bundleIdentifier
        )
    }

    override func configuration(
        shielding application: Application,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration(
            name: application.localizedDisplayName,
            bundleId: application.bundleIdentifier
        )
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration(name: webDomain.domain, bundleId: nil)
    }

    override func configuration(
        shielding webDomain: WebDomain,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration(name: webDomain.domain, bundleId: nil)
    }

    // MARK: - State-driven configuration

    private func makeConfiguration(name: String?, bundleId: String?) -> ShieldConfiguration {
        let defaults = GatewayCore.defaults
        let now = GatewayCore.now
        let config = GatewayCore.loadConfig()
        let appName = (name?.isEmpty == false) ? name! : "this app"

        // Let the ShieldAction extension (which only gets an opaque token)
        // know which app this shield is covering.
        if let defaults {
            if let name, !name.isEmpty {
                defaults.set(name, forKey: GatewayKeys.shownName)
            } else {
                defaults.removeObject(forKey: GatewayKeys.shownName)
            }
            if let bundleId, !bundleId.isEmpty {
                defaults.set(bundleId, forKey: GatewayKeys.shownBundleId)
            } else {
                defaults.removeObject(forKey: GatewayKeys.shownBundleId)
            }
            defaults.set(now, forKey: GatewayKeys.shownAt)
        }

        // 1. In-shield pause running or just finished.
        let breathUntil = defaults?.double(forKey: GatewayKeys.breathUntil) ?? 0
        if breathUntil > 0 {
            if now < breathUntil {
                let remaining = max(1, Int((breathUntil - now).rounded(.up)))
                return build(
                    title: "Breathe in… and out",
                    subtitle: "About \(remaining)s left. Tap Continue when the pause is over.",
                    primary: "Continue",
                    secondary: "I don't need it"
                )
            }
            if now <= breathUntil + GatewayCore.readyGraceSeconds {
                return build(
                    title: "Nicely done",
                    subtitle: "Still want \(appName)? It stays open for \(sessionLabel(config)).",
                    primary: "Continue to \(appName)",
                    secondary: "I don't need it"
                )
            }
        }

        // 2. We asked iOS to open Next Thing and it has not picked that up.
        let handoffAt = defaults?.double(forKey: GatewayKeys.handoffAt) ?? 0
        if handoffAt > 0, now - handoffAt < GatewayCore.handoffWindowSeconds {
            if #available(iOS 26.5, *) {
                // No notification on this iOS: the button opens the app
                // directly, so reaching this state means that did not happen.
                return build(
                    title: "Pause here instead",
                    subtitle: "Next Thing didn't open. Take your breath right here.",
                    primary: "Start my pause",
                    secondary: "I don't need it"
                )
            }
            return build(
                title: "Check the top of your screen",
                subtitle: "Tap the Next Thing notification to start your breathing pause.",
                primary: "Pause here instead",
                secondary: "I don't need it"
            )
        }

        // 3. The shield just came back over an app that was in use.
        let noticeAt = defaults?.double(forKey: GatewayKeys.noticeAt) ?? 0
        if noticeAt > 0, now - noticeAt < 120,
           let notice = defaults?.string(forKey: GatewayKeys.notice) {
            if notice.hasPrefix("checkin:") {
                let minutes = String(notice.dropFirst("checkin:".count))
                return build(
                    title: "\(minutes) minutes today",
                    subtitle: "Quick check-in. Is this still what you want to be doing?",
                    primary: "Take a breath",
                    secondary: "I'm done"
                )
            }
            return build(
                title: "Time's up",
                subtitle: "Your \(sessionLabel(config)) with \(appName) are over. Want to keep going?",
                primary: "Take a breath",
                secondary: "I'm done"
            )
        }

        // 4. Idle: the user just opened a paused app.
        let pause = Int(
            GatewayCore.pauseSeconds(config: config, opensSoFar: GatewayCore.opensToday())
                .rounded())
        return build(
            title: "Pause before \(appName)",
            subtitle: "Take a \(pause)-second breath first, then decide if you still want it.",
            primary: "Take a breath",
            secondary: "I don't need it"
        )
    }

    private func sessionLabel(_ config: GatewayConfig) -> String {
        let minutes = max(config.sessionMinutes, 1)
        return minutes == 1 ? "1 minute" : "\(minutes) minutes"
    }

    private func build(
        title: String,
        subtitle: String,
        primary: String,
        secondary: String
    ) -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: brandBackground,
            icon: UIImage(named: "ShieldIcon"),
            title: ShieldConfiguration.Label(text: title, color: .label),
            subtitle: ShieldConfiguration.Label(text: subtitle, color: .secondaryLabel),
            primaryButtonLabel: ShieldConfiguration.Label(text: primary, color: .white),
            primaryButtonBackgroundColor: brandGreen,
            secondaryButtonLabel: ShieldConfiguration.Label(text: secondary, color: .secondaryLabel)
        )
    }
}
