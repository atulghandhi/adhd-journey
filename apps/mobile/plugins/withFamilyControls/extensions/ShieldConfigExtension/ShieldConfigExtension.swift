import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

// Keys shared with ShieldActionExtension via the App Group.
private let appGroupID = "group.app.nextthing"
private let breathUntilKey = "gateway_breath_until"

// Must match ShieldActionExtension.readyGraceSeconds.
private let readyGraceSeconds: TimeInterval = 120

private let brandGreen = UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0)
private let brandBackground = UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0)

/// The shield has three states, driven by `gateway_breath_until`:
///  - idle:      "Take a breath first"  → primary "Start breathing"
///  - breathing: pause in progress      → primary "Continue" (re-taps refresh
///               the remaining-seconds label via `.defer`)
///  - ready:     pause elapsed          → primary "Continue" unlocks the app
class ShieldConfigExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding application: Application,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding webDomain: WebDomain
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding webDomain: WebDomain,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    // MARK: - State-driven configuration

    private func makeConfiguration() -> ShieldConfiguration {
        let defaults = UserDefaults(suiteName: appGroupID)
        let now = Date().timeIntervalSince1970
        let breathUntil = defaults?.double(forKey: breathUntilKey) ?? 0

        if breathUntil > 0 {
            if now < breathUntil {
                let remaining = max(1, Int((breathUntil - now).rounded(.up)))
                return buildConfiguration(
                    title: "Breathe in… and out",
                    subtitle: "About \(remaining)s to go. Tap Continue when the pause is over.",
                    primaryLabel: "Continue"
                )
            }
            if now <= breathUntil + readyGraceSeconds {
                return buildConfiguration(
                    title: "Nicely done",
                    subtitle: "Still want to open it? Tap Continue.",
                    primaryLabel: "Continue"
                )
            }
        }

        return buildConfiguration(
            title: "Take a breath first",
            subtitle: "A quick pause before you scroll",
            primaryLabel: "Start breathing"
        )
    }

    private func buildConfiguration(
        title: String,
        subtitle: String,
        primaryLabel: String
    ) -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: brandBackground,
            icon: UIImage(named: "AppIcon"),
            title: ShieldConfiguration.Label(text: title, color: .label),
            subtitle: ShieldConfiguration.Label(text: subtitle, color: .secondaryLabel),
            primaryButtonLabel: ShieldConfiguration.Label(text: primaryLabel, color: .white),
            primaryButtonBackgroundColor: brandGreen,
            secondaryButtonLabel: ShieldConfiguration.Label(text: "Go back", color: .secondaryLabel)
        )
    }
}
