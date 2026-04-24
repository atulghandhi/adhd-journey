import ExpoModulesCore
import FamilyControls
import ManagedSettings
import DeviceActivity
import Foundation
import SwiftUI
import UIKit

// MARK: - Shared data

private let appGroupID = "group.app.nextthing"
private let sharedDefaultsKey = "gateway_shared_data"
private let shieldedAppsKey = "shielded_app_tokens"

// MARK: - Module

public class FamilyControlsBridgeModule: Module {
    private let store = ManagedSettingsStore()

    public func definition() -> ModuleDefinition {
        Name("FamilyControlsBridge")

        // ------------------------------------------------------------------
        // Authorization
        // ------------------------------------------------------------------

        AsyncFunction("requestAuthorization") { () -> Bool in
            if #available(iOS 16.0, *) {
                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    return true
                } catch {
                    return false
                }
            }
            return false
        }

        AsyncFunction("getAuthorizationStatus") { () -> String in
            if #available(iOS 16.0, *) {
                switch AuthorizationCenter.shared.authorizationStatus {
                case .approved: return "authorized"
                case .denied: return "denied"
                default: return "notDetermined"
                }
            }
            return "notDetermined"
        }

        // ------------------------------------------------------------------
        // Activity Picker — presents Apple's native FamilyActivityPicker
        // ------------------------------------------------------------------

        AsyncFunction("presentActivityPicker") { () -> Int in
            // FamilyActivityPicker is a SwiftUI view. We present it via
            // a UIHostingController from the root view controller.
            if #available(iOS 16.0, *) {
                return await withCheckedContinuation { continuation in
                    DispatchQueue.main.async {
                        guard let rootVC = UIApplication.shared
                            .connectedScenes
                            .compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController })
                            .first
                        else {
                            continuation.resume(returning: 0)
                            return
                        }

                        // Preload the picker with the currently-selected tokens so
                        // the user can see/deselect what they already shielded.
                        var initialSelection = FamilyActivitySelection()
                        if let existingApps = self.loadShieldedTokenArray() {
                            initialSelection.applicationTokens = Set(existingApps)
                        }
                        if let existingCategories = self.loadShieldedCategoryArray() {
                            initialSelection.categoryTokens = Set(existingCategories)
                        }
                        let pickerVC = FamilyActivityPickerViewController(
                            initialSelection: initialSelection
                        ) { selection in
                            // Persist selection as an ordered array so the JS
                            // side can show per-index chips + remove by index.
                            let defaults = UserDefaults(suiteName: appGroupID)
                            let appTokens = Array(selection.applicationTokens)
                            let categoryTokens = Array(selection.categoryTokens)
                            let tokenCount = appTokens.count + categoryTokens.count
                            
                            if let appData = try? JSONEncoder().encode(appTokens) {
                                defaults?.set(appData, forKey: shieldedAppsKey)
                            }
                            if let catData = try? JSONEncoder().encode(categoryTokens) {
                                defaults?.set(catData, forKey: "shielded_category_tokens")
                            }
                            
                            rootVC.dismiss(animated: true) {
                                continuation.resume(returning: tokenCount)
                            }
                        }
                        rootVC.present(pickerVC, animated: true)
                    }
                }
            }
            return 0
        }

        // ------------------------------------------------------------------
        // Shield management
        // ------------------------------------------------------------------

        AsyncFunction("applyShields") { () -> Bool in
            if #available(iOS 16.0, *) {
                let appTokens = self.loadShieldedTokens()
                let catTokens = self.loadShieldedCategoryTokens()
                
                if appTokens == nil && catTokens == nil { return false }
                
                // Clear any system restrictions first to ensure our custom shield takes priority
                self.store.application.blockedApplications = nil
                
                self.store.shield.applications = appTokens
                // Only set the category shield when there are categories to shield;
                // passing `.specific([])` is still a restriction with an empty set,
                // which can confuse iOS and sometimes lands on the generic
                // "app is restricted" fallback UI.
                if let cats = catTokens, !cats.isEmpty {
                    self.store.shield.applicationCategories = .specific(cats)
                } else {
                    self.store.shield.applicationCategories = nil
                }
                return true
            }
            return false
        }

        AsyncFunction("removeShields") { () -> Bool in
            if #available(iOS 16.0, *) {
                self.store.application.blockedApplications = nil
                self.store.shield.applications = nil
                self.store.shield.applicationCategories = nil
                return true
            }
            return false
        }

        // Number of apps currently persisted for shielding.
        AsyncFunction("getShieldedAppCount") { () -> Int in
            if #available(iOS 16.0, *) {
                return self.loadShieldedTokenArray()?.count ?? 0
            }
            return 0
        }

        // Return tokens as base64 strings for the JS side to pass into the native label view.
        AsyncFunction("getShieldedAppTokens") { () -> [String] in
            if #available(iOS 16.0, *) {
                var allTokens: [String] = []
                
                if let apps = self.loadShieldedTokenArray() {
                    allTokens.append(contentsOf: apps.compactMap { token in
                        if let data = try? JSONEncoder().encode(token) {
                            return "app:" + data.base64EncodedString()
                        }
                        return nil
                    })
                }
                
                if let cats = self.loadShieldedCategoryArray() {
                    allTokens.append(contentsOf: cats.compactMap { token in
                        if let data = try? JSONEncoder().encode(token) {
                            return "category:" + data.base64EncodedString()
                        }
                        return nil
                    })
                }
                
                return allTokens
            }
            return []
        }

        // Remove a single shielded app by its index in the stored array, then
        // re-apply the shield with the updated set so the change takes effect
        // immediately.
        AsyncFunction("removeShieldedAppAt") { (index: Int) -> Bool in
            if #available(iOS 16.0, *) {
                var apps = self.loadShieldedTokenArray() ?? []
                var cats = self.loadShieldedCategoryArray() ?? []
                
                if index < 0 || index >= (apps.count + cats.count) {
                    return false
                }
                
                if index < apps.count {
                    apps.remove(at: index)
                    let defaults = UserDefaults(suiteName: appGroupID)
                    if let data = try? JSONEncoder().encode(apps) {
                        defaults?.set(data, forKey: shieldedAppsKey)
                    }
                } else {
                    cats.remove(at: index - apps.count)
                    let defaults = UserDefaults(suiteName: appGroupID)
                    if let data = try? JSONEncoder().encode(cats) {
                        defaults?.set(data, forKey: "shielded_category_tokens")
                    }
                }
                
                self.store.application.blockedApplications = nil
                self.store.shield.applications = apps.isEmpty ? nil : Set(apps)
                if cats.isEmpty {
                    self.store.shield.applicationCategories = nil
                } else {
                    self.store.shield.applicationCategories = .specific(Set(cats))
                }
                return true
            }
            return false
        }

        // Clear every shielded app.
        AsyncFunction("clearShieldedApps") { () -> Bool in
            if #available(iOS 16.0, *) {
                let defaults = UserDefaults(suiteName: appGroupID)
                defaults?.removeObject(forKey: shieldedAppsKey)
                defaults?.removeObject(forKey: "shielded_category_tokens")
                self.store.application.blockedApplications = nil
                self.store.shield.applications = nil
                self.store.shield.applicationCategories = nil
                return true
            }
            return false
        }

        AsyncFunction("removeShieldsTemporarily") { (durationSeconds: Double) -> Bool in
            if #available(iOS 16.0, *) {
                self.store.application.blockedApplications = nil
                self.store.shield.applications = nil
                self.store.shield.applicationCategories = nil

                // Re-apply after duration
                DispatchQueue.main.asyncAfter(deadline: .now() + durationSeconds) { [weak self] in
                    if let tokens = self?.loadShieldedTokens() {
                        self?.store.shield.applications = tokens
                    }
                    if let cats = self?.loadShieldedCategoryTokens() {
                        self?.store.shield.applicationCategories = .specific(cats)
                    }
                }
                return true
            }
            return false
        }

        // ------------------------------------------------------------------
        // Native Views
        // ------------------------------------------------------------------

        View(ShieldedAppView.self) {
            Prop("token") { (view: ShieldedAppView, token: String) in
                view.setToken(token)
            }
        }

        // ------------------------------------------------------------------
        // Doom scroll monitor
        // ------------------------------------------------------------------

        AsyncFunction("startDoomScrollMonitor") { (firstMinutes: Int, secondMinutes: Int) -> Bool in
            if #available(iOS 16.0, *) {
                let center = DeviceActivityCenter()
                let schedule = DeviceActivitySchedule(
                    intervalStart: DateComponents(hour: 0, minute: 0),
                    intervalEnd: DateComponents(hour: 23, minute: 59),
                    repeats: true
                )

                let events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
                    DeviceActivityEvent.Name("doom_scroll_first"): DeviceActivityEvent(
                        threshold: DateComponents(minute: firstMinutes)
                    ),
                    DeviceActivityEvent.Name("doom_scroll_second"): DeviceActivityEvent(
                        threshold: DateComponents(minute: firstMinutes + secondMinutes)
                    ),
                ]

                do {
                    try center.startMonitoring(
                        DeviceActivityName("gateway_doom_scroll"),
                        during: schedule,
                        events: events
                    )
                    return true
                } catch {
                    return false
                }
            }
            return false
        }

        AsyncFunction("stopDoomScrollMonitor") { () -> Bool in
            if #available(iOS 16.0, *) {
                let center = DeviceActivityCenter()
                center.stopMonitoring([DeviceActivityName("gateway_doom_scroll")])
                return true
            }
            return false
        }

        // ------------------------------------------------------------------
        // Shared data (App Group UserDefaults)
        // ------------------------------------------------------------------

        AsyncFunction("writeSharedData") { (jsonString: String) -> Bool in
            let defaults = UserDefaults(suiteName: appGroupID)
            defaults?.set(jsonString, forKey: sharedDefaultsKey)
            return true
        }
    }

    // MARK: - Helpers

    @available(iOS 16.0, *)
    private func loadShieldedTokens() -> Set<ApplicationToken>? {
        if let array = loadShieldedTokenArray() {
            return Set(array)
        }
        return nil
    }

    @available(iOS 16.0, *)
    private func loadShieldedCategoryTokens() -> Set<ActivityCategoryToken>? {
        if let array = loadShieldedCategoryArray() {
            return Set(array)
        }
        return nil
    }

    // The stored selection may have been written as either an ordered Array
    // (new format) or a Set (legacy format). Try both so older installs keep
    // working after upgrade.
    @available(iOS 16.0, *)
    private func loadShieldedTokenArray() -> [ApplicationToken]? {
        let defaults = UserDefaults(suiteName: appGroupID)
        guard let data = defaults?.data(forKey: shieldedAppsKey) else { return nil }
        if let array = try? JSONDecoder().decode([ApplicationToken].self, from: data) {
            return array
        }
        if let set = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data) {
            return Array(set)
        }
        return nil
    }

    @available(iOS 16.0, *)
    private func loadShieldedCategoryArray() -> [ActivityCategoryToken]? {
        let defaults = UserDefaults(suiteName: appGroupID)
        guard let data = defaults?.data(forKey: "shielded_category_tokens") else { return nil }
        if let array = try? JSONDecoder().decode([ActivityCategoryToken].self, from: data) {
            return array
        }
        if let set = try? JSONDecoder().decode(Set<ActivityCategoryToken>.self, from: data) {
            return Array(set)
        }
        return nil
    }
}

// MARK: - FamilyActivityPicker UIKit wrapper

@available(iOS 16.0, *)
private class FamilyActivityPickerViewController: UIViewController {
    typealias SelectionHandler = (FamilyActivitySelection) -> Void

    private var selection: FamilyActivitySelection
    private let onDone: SelectionHandler

    init(initialSelection: FamilyActivitySelection = FamilyActivitySelection(),
         onDone: @escaping SelectionHandler) {
        self.selection = initialSelection
        self.onDone = onDone
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()

        let binding = Binding<FamilyActivitySelection>(
            get: { [weak self] in self?.selection ?? FamilyActivitySelection() },
            set: { [weak self] newValue in self?.selection = newValue }
        )
        let hostingController = UIHostingController(
            rootView: FamilyActivityPickerView(selection: binding, onDone: { [weak self] in
                guard let self else { return }
                self.onDone(self.selection)
            })
        )
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [UIView.AutoresizingMask.flexibleWidth, UIView.AutoresizingMask.flexibleHeight]
        hostingController.didMove(toParent: self)
    }
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerView: View {
    @Binding var selection: FamilyActivitySelection
    let onDone: () -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Select Apps")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { onDone() }
                    }
                }
        }
    }
}

// MARK: - Native Views

public class ShieldedAppView: ExpoView {
    private let hostingController = UIHostingController(rootView: AnyView(Text("Loading...")))

    public required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        hostingController.view.backgroundColor = .clear
        addSubview(hostingController.view)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        hostingController.view.frame = bounds
    }

    func setToken(_ tokenData: String) {
        if #available(iOS 16.0, *) {
            if tokenData.hasPrefix("app:") {
                let base64 = String(tokenData.dropFirst(4))
                guard let data = Data(base64Encoded: base64),
                      let token = try? JSONDecoder().decode(ApplicationToken.self, from: data) else {
                    hostingController.rootView = AnyView(Text("Unknown App"))
                    return
                }
                hostingController.rootView = AnyView(
                    Label(token)
                        .labelStyle(.titleAndIcon)
                        .font(.system(size: 14, weight: .medium))
                )
            } else if tokenData.hasPrefix("category:") {
                let base64 = String(tokenData.dropFirst(9))
                guard let data = Data(base64Encoded: base64),
                      let token = try? JSONDecoder().decode(ActivityCategoryToken.self, from: data) else {
                    hostingController.rootView = AnyView(Text("Unknown Category"))
                    return
                }
                hostingController.rootView = AnyView(
                    Label(token)
                        .labelStyle(.titleAndIcon)
                        .font(.system(size: 14, weight: .medium))
                )
            } else {
                // Fallback for old unprefixed tokens (assume app)
                guard let data = Data(base64Encoded: tokenData),
                      let token = try? JSONDecoder().decode(ApplicationToken.self, from: data) else {
                    hostingController.rootView = AnyView(Text("Unknown"))
                    return
                }
                hostingController.rootView = AnyView(
                    Label(token)
                        .labelStyle(.titleAndIcon)
                        .font(.system(size: 14, weight: .medium))
                )
            }
        } else {
            hostingController.rootView = AnyView(Text("iOS 16+ Required"))
        }
    }
}
