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
                        if let existing = self.loadShieldedTokenArray() {
                            initialSelection.applicationTokens = Set(existing)
                        }
                        let pickerVC = FamilyActivityPickerViewController(
                            initialSelection: initialSelection
                        ) { selection in
                            // Persist selection as an ordered array so the JS
                            // side can show per-index chips + remove by index.
                            let defaults = UserDefaults(suiteName: appGroupID)
                            let tokenArray = Array(selection.applicationTokens)
                            let tokenCount = tokenArray.count
                            if let data = try? JSONEncoder().encode(tokenArray) {
                                defaults?.set(data, forKey: shieldedAppsKey)
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
            guard let tokens = self.loadShieldedTokens() else { return false }
            self.store.shield.applications = tokens
            return true
        }

        AsyncFunction("removeShields") { () -> Bool in
            self.store.shield.applications = nil
            return true
        }

        // Number of apps currently persisted for shielding.
        AsyncFunction("getShieldedAppCount") { () -> Int in
            return self.loadShieldedTokenArray()?.count ?? 0
        }

        // Remove a single shielded app by its index in the stored array, then
        // re-apply the shield with the updated set so the change takes effect
        // immediately.
        AsyncFunction("removeShieldedAppAt") { (index: Int) -> Bool in
            guard var tokens = self.loadShieldedTokenArray(),
                  index >= 0, index < tokens.count else { return false }
            tokens.remove(at: index)
            let defaults = UserDefaults(suiteName: appGroupID)
            if let data = try? JSONEncoder().encode(tokens) {
                defaults?.set(data, forKey: shieldedAppsKey)
            }
            if tokens.isEmpty {
                self.store.shield.applications = nil
            } else {
                self.store.shield.applications = Set(tokens)
            }
            return true
        }

        // Clear every shielded app.
        AsyncFunction("clearShieldedApps") { () -> Bool in
            let defaults = UserDefaults(suiteName: appGroupID)
            defaults?.removeObject(forKey: shieldedAppsKey)
            self.store.shield.applications = nil
            return true
        }

        AsyncFunction("removeShieldsTemporarily") { (durationSeconds: Double) -> Bool in
            self.store.shield.applications = nil

            // Re-apply after duration
            DispatchQueue.main.asyncAfter(deadline: .now() + durationSeconds) { [weak self] in
                if let tokens = self?.loadShieldedTokens() {
                    self?.store.shield.applications = tokens
                }
            }
            return true
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

    private func loadShieldedTokens() -> Set<ApplicationToken>? {
        if let array = loadShieldedTokenArray() {
            return Set(array)
        }
        return nil
    }

    // The stored selection may have been written as either an ordered Array
    // (new format) or a Set (legacy format). Try both so older installs keep
    // working after upgrade.
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
