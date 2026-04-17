import Foundation
import ManagedSettings
import ManagedSettingsUI

class ShieldActionExtension: ShieldActionDelegate {
    private func recordPendingDeepLink() {
        let defaults = UserDefaults(suiteName: "group.app.nextthing")
        defaults?.set("disrupt", forKey: "pendingDeepLink")
        defaults?.set(Date().timeIntervalSince1970, forKey: "pendingDeepLinkAt")
    }

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            // Record the deep link target; main app reads this on foreground.
            recordPendingDeepLink()
            completionHandler(.close)
        case .secondaryButtonPressed:
            // "Go back" — just dismiss the shield
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            recordPendingDeepLink()
            completionHandler(.close)
        case .secondaryButtonPressed:
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
