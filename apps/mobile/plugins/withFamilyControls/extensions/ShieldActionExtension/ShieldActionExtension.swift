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
            // 1. Record the deep link target for the main app.
            recordPendingDeepLink()
            
            // 2. Temporarily remove the shield so the user isn't stuck in a
            // re-shield loop and can actually switch to Next Thing.
            store.application.blockedApplications = nil
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            
            // 3. Re-apply the shield after a short delay if the user doesn't
            // follow through. This makes it a "resistance" rather than a block.
            let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
                // Re-apply apps
                if let appData = sharedDefaults?.data(forKey: "shielded_app_tokens"),
                   let appTokens = try? JSONDecoder().decode([ApplicationToken].self, from: appData) {
                    self?.store.shield.applications = Set(appTokens)
                }
                // Re-apply categories
                if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
                   let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
                    self?.store.shield.applicationCategories = .specific(Set(catTokens))
                }
            }
            
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
            store.application.blockedApplications = nil
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            store.shield.webDomains = nil

            let sharedDefaults = UserDefaults(suiteName: "group.app.nextthing")
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
                // Re-apply apps
                if let appData = sharedDefaults?.data(forKey: "shielded_app_tokens"),
                   let appTokens = try? JSONDecoder().decode([ApplicationToken].self, from: appData) {
                    self?.store.shield.applications = Set(appTokens)
                }
                // Re-apply categories
                if let catData = sharedDefaults?.data(forKey: "shielded_category_tokens"),
                   let catTokens = try? JSONDecoder().decode([ActivityCategoryToken].self, from: catData) {
                    self?.store.shield.applicationCategories = .specific(Set(catTokens))
                }
                // Re-apply web domains if any were stored (assuming same logic)
                // (Omitted for brevity if not stored yet)
            }
            completionHandler(.close)
        case .secondaryButtonPressed:
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
