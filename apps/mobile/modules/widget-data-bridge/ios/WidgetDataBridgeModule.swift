import ExpoModulesCore
import WidgetKit

public class WidgetDataBridgeModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WidgetDataBridge")

        Function("setWidgetData") { (jsonString: String) -> Bool in
            let defaults = UserDefaults(suiteName: "group.app.nextthing")
            defaults?.set(jsonString, forKey: "widget_data")
            defaults?.synchronize()

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }

            return true
        }

        Function("clearWidgetData") { () -> Bool in
            let defaults = UserDefaults(suiteName: "group.app.nextthing")
            defaults?.removeObject(forKey: "widget_data")
            defaults?.synchronize()

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }

            return true
        }

        // Read any pending deep-link written by the ShieldAction extension.
        // Returns nil if nothing pending. Consumes-on-read only when `clear`
        // is true, to avoid race conditions between AppState.change and the
        // deep-link handler wiring up.
        Function("readPendingDeepLink") { (clear: Bool) -> [String: Any]? in
            let defaults = UserDefaults(suiteName: "group.app.nextthing")
            guard let link = defaults?.string(forKey: "pendingDeepLink") else {
                return nil
            }
            let at = defaults?.double(forKey: "pendingDeepLinkAt") ?? 0
            if clear {
                defaults?.removeObject(forKey: "pendingDeepLink")
                defaults?.removeObject(forKey: "pendingDeepLinkAt")
                defaults?.synchronize()
            }
            return ["link": link, "at": at]
        }

        Function("clearPendingDeepLink") { () -> Bool in
            let defaults = UserDefaults(suiteName: "group.app.nextthing")
            defaults?.removeObject(forKey: "pendingDeepLink")
            defaults?.removeObject(forKey: "pendingDeepLinkAt")
            defaults?.synchronize()
            return true
        }
    }
}
