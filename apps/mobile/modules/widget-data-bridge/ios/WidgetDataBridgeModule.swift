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
    }
}
