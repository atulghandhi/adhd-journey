import SwiftUI
import WidgetKit

// MARK: - Timeline Entry

struct TodayTaskEntry: TimelineEntry {
    let date: Date
    let taskTitle: String?
    let taskDescription: String?
    let taskDay: Int?
    let totalTasks: Int
    let completed: Bool
    let streakCount: Int
}

// MARK: - Timeline Provider

struct TodayTaskProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayTaskEntry {
        TodayTaskEntry(
            date: Date(),
            taskTitle: "Build a shutdown ritual",
            taskDescription: "Create a simple routine to end your workday. This helps your brain transition out of work mode.",
            taskDay: 12,
            totalTasks: 30,
            completed: false,
            streakCount: 7
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayTaskEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayTaskEntry>) -> Void) {
        let entry = makeEntry()
        // Refresh in 1 hour or when the app explicitly reloads timelines
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func makeEntry() -> TodayTaskEntry {
        guard let data = loadWidgetData() else {
            return TodayTaskEntry(
                date: Date(),
                taskTitle: nil,
                taskDescription: nil,
                taskDay: nil,
                totalTasks: 30,
                completed: false,
                streakCount: 0
            )
        }

        return TodayTaskEntry(
            date: Date(),
            taskTitle: data.currentTaskTitle,
            taskDescription: data.currentTaskDescription,
            taskDay: data.currentTaskDay,
            totalTasks: data.totalTasks,
            completed: data.todayTaskCompleted,
            streakCount: data.streakCount
        )
    }
}

// MARK: - Brand Colors

extension Color {
    static let ntPrimary = Color(red: 0.25, green: 0.57, blue: 0.42) // #40916C
    static let ntBackground = Color(red: 0.94, green: 1.0, blue: 0.96) // #F0FFF4
    static let ntDarkBg = Color(red: 0.06, green: 0.10, blue: 0.08) // #0F1A14
    static let ntDarkSurface = Color(red: 0.10, green: 0.18, blue: 0.14) // #1A2E23
    static let ntSecondary = Color(red: 0.42, green: 0.52, blue: 0.47) // #6B8574
    static let ntLightGreen = Color(red: 0.85, green: 0.95, blue: 0.86) // #D8F3DC
}

// MARK: - Widget View (Medium)

struct TodayTaskMediumView: View {
    let entry: TodayTaskEntry
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        let isDark = colorScheme == .dark

        if entry.completed {
            completedView(isDark: isDark)
        } else if let title = entry.taskTitle, let day = entry.taskDay {
            activeTaskView(title: title, day: day, isDark: isDark)
        } else {
            emptyView(isDark: isDark)
        }
    }

    @ViewBuilder
    private func activeTaskView(title: String, day: Int, isDark: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Day \(day) of \(entry.totalTasks)")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .textCase(.uppercase)
                    .tracking(1.5)
                    .foregroundColor(isDark ? .ntSecondary : .ntSecondary)

                Spacer()

                if entry.streakCount > 0 {
                    HStack(spacing: 2) {
                        Text("🔥")
                            .font(.caption2)
                        Text("\(entry.streakCount)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.ntPrimary)
                    }
                }
            }

            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(isDark ? .white : Color(red: 0.13, green: 0.26, blue: 0.19))
                .lineLimit(2)

            if let desc = entry.taskDescription {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(isDark ? .ntSecondary : .ntSecondary)
                    .lineLimit(2)
            }

            Spacer(minLength: 0)

            HStack {
                Spacer()
                Text("Start check-in →")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.ntPrimary)
            }
        }
        .padding(14)
        .containerBackground(for: .widget) {
            isDark ? Color.ntDarkSurface : Color.white
        }
        .widgetURL(URL(string: "nextthing://(tabs)/journey"))
    }

    @ViewBuilder
    private func completedView(isDark: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Today's task")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .textCase(.uppercase)
                    .tracking(1.5)
                    .foregroundColor(isDark ? .ntSecondary : .ntSecondary)

                Spacer()

                Text("✅")
                    .font(.title3)
            }

            if let title = entry.taskTitle {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(isDark ? .white : Color(red: 0.13, green: 0.26, blue: 0.19))
                    .lineLimit(2)
            }

            Spacer(minLength: 0)

            HStack {
                Text("Completed today 🎉")
                    .font(.caption)
                    .foregroundColor(.ntPrimary)
                    .fontWeight(.medium)
                Spacer()
                if entry.streakCount > 0 {
                    Text("🔥 streak: \(entry.streakCount)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.ntPrimary)
                }
            }
        }
        .padding(14)
        .containerBackground(for: .widget) {
            isDark ? Color.ntDarkSurface : Color.white
        }
        .widgetURL(URL(string: "nextthing://(tabs)/journey"))
    }

    @ViewBuilder
    private func emptyView(isDark: Bool) -> some View {
        VStack(spacing: 8) {
            Spacer()
            Text("Next Thing")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(isDark ? .white : Color(red: 0.13, green: 0.26, blue: 0.19))
            Text("Open the app to load\nyour today's task")
                .font(.caption)
                .foregroundColor(.ntSecondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding(14)
        .containerBackground(for: .widget) {
            isDark ? Color.ntDarkSurface : Color.white
        }
        .widgetURL(URL(string: "nextthing://(tabs)/journey"))
    }
}

// MARK: - Widget View (Small)

struct TodayTaskSmallView: View {
    let entry: TodayTaskEntry
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        let isDark = colorScheme == .dark

        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if let day = entry.taskDay {
                    Text("Day \(day)")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.ntPrimary)
                }
                Spacer()
                if entry.completed {
                    Text("✅")
                        .font(.caption)
                } else if entry.streakCount > 0 {
                    Text("🔥\(entry.streakCount)")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.ntPrimary)
                }
            }

            Spacer(minLength: 2)

            if let title = entry.taskTitle {
                Text(title)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(isDark ? .white : Color(red: 0.13, green: 0.26, blue: 0.19))
                    .lineLimit(3)
            } else {
                Text("Open Next Thing\nto get started")
                    .font(.caption)
                    .foregroundColor(.ntSecondary)
            }

            Spacer(minLength: 0)

            if entry.completed {
                Text("Done today")
                    .font(.caption2)
                    .foregroundColor(.ntPrimary)
                    .fontWeight(.medium)
            } else if entry.taskTitle != nil {
                Text("Check in →")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(.ntPrimary)
            }
        }
        .padding(12)
        .containerBackground(for: .widget) {
            isDark ? Color.ntDarkSurface : Color.white
        }
        .widgetURL(URL(string: "nextthing://(tabs)/journey"))
    }
}

// MARK: - Lock Screen Widget (Accessory Rectangular)

struct TodayTaskAccessoryRectangularView: View {
    let entry: TodayTaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if entry.completed {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption2)
                    Text("Task complete")
                        .font(.caption2)
                        .fontWeight(.semibold)
                }
            } else if let day = entry.taskDay {
                Text("Day \(day) of \(entry.totalTasks)")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .textCase(.uppercase)
            }

            if let title = entry.taskTitle {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(2)
            } else {
                Text("Open Next Thing")
                    .font(.caption)
            }
        }
        .containerBackground(for: .widget) { Color.clear }
    }
}

// MARK: - Lock Screen Widget (Accessory Inline)

struct TodayTaskAccessoryInlineView: View {
    let entry: TodayTaskEntry

    var body: some View {
        if entry.completed {
            Label("✅ Day \(entry.taskDay ?? 0) done", systemImage: "checkmark.circle")
        } else if let day = entry.taskDay {
            Label("Day \(day)/\(entry.totalTasks) 🔥\(entry.streakCount)", systemImage: "flame")
        } else {
            Label("Next Thing", systemImage: "target")
        }
    }
}

// MARK: - Adaptive View

struct TodayTaskWidgetEntryView: View {
    let entry: TodayTaskEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            TodayTaskSmallView(entry: entry)
        case .systemMedium:
            TodayTaskMediumView(entry: entry)
        case .accessoryRectangular:
            TodayTaskAccessoryRectangularView(entry: entry)
        case .accessoryInline:
            TodayTaskAccessoryInlineView(entry: entry)
        default:
            TodayTaskMediumView(entry: entry)
        }
    }
}

// MARK: - Widget Definition

struct TodayTaskWidget: Widget {
    let kind: String = "TodayTaskWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodayTaskProvider()) { entry in
            TodayTaskWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today's Task")
        .description("See your current ADHD strategy task and check in directly from your Home Screen.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}

// MARK: - Previews

#if DEBUG
#Preview("Medium — Active", as: .systemMedium) {
    TodayTaskWidget()
} timeline: {
    TodayTaskEntry(
        date: Date(),
        taskTitle: "Build a shutdown ritual for your workday",
        taskDescription: "Create a simple routine to end your workday. This helps your brain transition out of work mode.",
        taskDay: 12,
        totalTasks: 30,
        completed: false,
        streakCount: 7
    )
}

#Preview("Medium — Completed", as: .systemMedium) {
    TodayTaskWidget()
} timeline: {
    TodayTaskEntry(
        date: Date(),
        taskTitle: "Build a shutdown ritual for your workday",
        taskDescription: nil,
        taskDay: 12,
        totalTasks: 30,
        completed: true,
        streakCount: 7
    )
}

#Preview("Small — Active", as: .systemSmall) {
    TodayTaskWidget()
} timeline: {
    TodayTaskEntry(
        date: Date(),
        taskTitle: "Build a shutdown ritual for your workday",
        taskDescription: nil,
        taskDay: 12,
        totalTasks: 30,
        completed: false,
        streakCount: 7
    )
}
#endif
