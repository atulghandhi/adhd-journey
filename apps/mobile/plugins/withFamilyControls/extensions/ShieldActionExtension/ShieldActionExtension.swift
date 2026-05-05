import Foundation
import ManagedSettings
import ManagedSettingsUI

class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore()

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
            recordPendingDeepLink()

            // Temporarily remove all shields so the user can switch to Next Thing.
            store.clearAllSettings()

            // Re-apply shields after a short delay (resistance, not permanent removal).
            let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
                if let appData = sharedDefaults?.data(forKey: "shielded_app_tokens"),
                   let appTokens = try? JSONDecoder().decode([ApplicationToken].self, from: appData) {
                    self?.store.shield.applications = Set(appTokens)
                }
                if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
                   let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
                    self?.store.shield.applicationCategories = .specific(Set(catTokens))
                }
            }

            completionHandler(.close)
        case .secondaryButtonPressed:
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
            store.clearAllSettings()

            let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
                if let appData = sharedDefaults?.data(forKey: "shielded_app_tokens"),
                   let appTokens = try? JSONDecoder().decode([ApplicationToken].self, from: appData) {
                    self?.store.shield.applications = Set(appTokens)
                }
                if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
                   let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
                    self?.store.shield.applicationCategories = .specific(Set(catTokens))
                }
            }
            completionHandler(.close)
        case .secondaryButtonPressed:
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
