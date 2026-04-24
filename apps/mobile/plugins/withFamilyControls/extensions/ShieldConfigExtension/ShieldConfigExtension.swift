import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0),
            icon: UIImage(named: "AppIcon"),
            title: ShieldConfiguration.Label(
                text: "Take a breath first",
                color: .label
            ),
            subtitle: ShieldConfiguration.Label(
                text: "A quick pause before you scroll",
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Start breathing",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Go back",
                color: .secondaryLabel
            )
        )
    }

    override func configuration(
        shielding application: Application,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        return configuration(shielding: application)
    }

    override func configuration(
        shielding category: ActivityCategory
    ) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0),
            title: ShieldConfiguration.Label(
                text: "Take a breath first",
                color: .label
            ),
            subtitle: ShieldConfiguration.Label(
                text: "A quick pause before you scroll",
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Start breathing",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Go back",
                color: .secondaryLabel
            )
        )
    }

    override func configuration(
        shielding webDomain: WebDomain
    ) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: UIColor(red: 0.94, green: 1.0, blue: 0.96, alpha: 1.0),
            title: ShieldConfiguration.Label(
                text: "Take a breath first",
                color: .label
            ),
            subtitle: ShieldConfiguration.Label(
                text: "A quick pause before you scroll",
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Start breathing",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.25, green: 0.57, blue: 0.42, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Go back",
                color: .secondaryLabel
            )
        )
    }
}
