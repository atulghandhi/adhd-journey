import Foundation

/// Shared data contract between the main React Native app and the widget extension.
/// The main app writes this as JSON to App Group UserDefaults; the widget reads it.
struct WidgetData: Codable {
    let streakCount: Int
    let completedCount: Int
    let totalTasks: Int
    let currentTaskTitle: String?
    let currentTaskDay: Int?
    let currentTaskDescription: String?
    let todayTaskCompleted: Bool
    let lastUpdated: String // ISO 8601
}

/// Reads WidgetData from the shared App Group UserDefaults.
func loadWidgetData() -> WidgetData? {
    let defaults = UserDefaults(suiteName: "group.app.nextthing")
    guard let jsonString = defaults?.string(forKey: "widget_data"),
          let data = jsonString.data(using: .utf8) else {
        return nil
    }
    return try? JSONDecoder().decode(WidgetData.self, from: data)
}
