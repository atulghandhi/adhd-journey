import DeviceActivity
import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings
import SwiftUI
import UIKit
import UserNotifications

// JS bridge for App Disrupt (Screen Time shields).
//
// The shield logic itself lives in GatewayCore.swift so the app and the three
// extensions cannot drift apart. This module is the thin layer JS talks to:
// authorization, the app picker, syncing settings, and the unlock that the
// in-app breathing screen performs when the user chooses to continue.

public class FamilyControlsBridgeModule: Module {
    private let store = ManagedSettingsStore()

    public func definition() -> ModuleDefinition {
        Name("FamilyControlsBridge")

        // ------------------------------------------------------------------
        // Authorization
        // ------------------------------------------------------------------

        AsyncFunction("requestAuthorization") { () -> Bool in
            if #available(iOS 16.0, *) {
                // Already authorized: skip the system dialog entirely.
                if AuthorizationCenter.shared.authorizationStatus == .approved {
                    return true
                }

                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                } catch {
                    NSLog("[FamilyControlsBridge] requestAuthorization threw: %@", "\(error)")
                }

                // The status can lag behind the dialog dismissal on some iOS
                // versions. Poll for up to 2 seconds before giving up.
                for _ in 1...4 {
                    if AuthorizationCenter.shared.authorizationStatus == .approved {
                        return true
                    }
                    try? await Task.sleep(nanoseconds: 500_000_000)
                }

                return AuthorizationCenter.shared.authorizationStatus == .approved
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
        // Activity picker: Apple's native FamilyActivityPicker.
        // Resolves with the number of selected apps + categories, or -1 if
        // the user backed out without confirming.
        // ------------------------------------------------------------------

        AsyncFunction("presentActivityPicker") { () -> Int in
            if #available(iOS 16.0, *) {
                return await withCheckedContinuation { continuation in
                    DispatchQueue.main.async {
                        guard var presenter = UIApplication.shared
                            .connectedScenes
                            .compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController })
                            .first
                        else {
                            continuation.resume(returning: -1)
                            return
                        }
                        // Present from whatever is on top (a modal route, say).
                        while let presented = presenter.presentedViewController {
                            presenter = presented
                        }

                        // The continuation must be resumed exactly once,
                        // whichever way the sheet goes away.
                        var finished = false
                        let finish: (Int) -> Void = { value in
                            guard !finished else { return }
                            finished = true
                            continuation.resume(returning: value)
                        }

                        // Preload the picker so the user sees (and can
                        // deselect) what is already paused.
                        var initialSelection = FamilyActivitySelection()
                        initialSelection.applicationTokens = Set(GatewayCore.loadApps())
                        initialSelection.categoryTokens = Set(GatewayCore.loadCategories())

                        let pickerVC = FamilyActivityPickerViewController(
                            initialSelection: initialSelection,
                            onDone: { selection in
                                // Stored as ordered arrays so JS can show
                                // per-index chips and remove by index.
                                let apps = Array(selection.applicationTokens)
                                let categories = Array(selection.categoryTokens)
                                GatewayCore.saveApps(apps)
                                GatewayCore.saveCategories(categories)
                                finish(apps.count + categories.count)
                            },
                            onCancel: {
                                finish(-1)
                            }
                        )
                        presenter.present(pickerVC, animated: true)
                    }
                }
            }
            return -1
        }

        // ------------------------------------------------------------------
        // Selection
        // ------------------------------------------------------------------

        // Tokens as "app:<base64>" / "category:<base64>" strings for the
        // native label view below.
        AsyncFunction("getShieldedAppTokens") { () -> [String] in
            guard #available(iOS 16.0, *) else { return [] }
            var tokens: [String] = []
            for app in GatewayCore.loadApps() {
                if let data = try? JSONEncoder().encode(app) {
                    tokens.append("app:" + data.base64EncodedString())
                }
            }
            for category in GatewayCore.loadCategories() {
                if let data = try? JSONEncoder().encode(category) {
                    tokens.append("category:" + data.base64EncodedString())
                }
            }
            return tokens
        }

        // Remove one entry by its index in the list above and re-apply.
        AsyncFunction("removeShieldedAppAt") { (index: Int) -> Bool in
            guard #available(iOS 16.0, *) else { return false }
            var apps = GatewayCore.loadApps()
            var categories = GatewayCore.loadCategories()
            guard index >= 0, index < apps.count + categories.count else { return false }

            if index < apps.count {
                apps.remove(at: index)
                GatewayCore.saveApps(apps)
            } else {
                categories.remove(at: index - apps.count)
                GatewayCore.saveCategories(categories)
            }

            return await self.onMain {
                GatewayCore.applyShields(store: self.store)
                return true
            }
        }

        // ------------------------------------------------------------------
        // Settings sync + enforcement
        // ------------------------------------------------------------------

        // Store the settings for the extensions, then make the device match
        // them: shields on or off, an expired unlock session closed, the
        // daily monitor (re)started if its inputs changed. Safe to call on
        // every launch, foreground and settings change.
        AsyncFunction("syncGateway") { (configJSON: String) -> [String: Any] in
            guard #available(iOS 16.0, *) else { return [:] }
            return await self.onMain {
                GatewayCore.defaults?.set(configJSON, forKey: GatewayKeys.config)
                return self.enforce()
            }
        }

        // ------------------------------------------------------------------
        // Hand-off from the shield
        // ------------------------------------------------------------------

        // Called whenever the app becomes active. Returns the request the
        // ShieldAction extension left when the user tapped "Take a breath",
        // or nil. Reading it also tells the extension the hand-off worked.
        AsyncFunction("consumePendingShieldRequest") { () -> [String: Any]? in
            guard #available(iOS 16.0, *) else { return nil }
            guard let defaults = GatewayCore.defaults else { return nil }

            let pendingAt = defaults.double(forKey: GatewayKeys.pendingAt)
            defaults.removeObject(forKey: GatewayKeys.pendingAt)
            defaults.removeObject(forKey: GatewayKeys.handoffAt)
            UNUserNotificationCenter.current()
                .removeDeliveredNotifications(withIdentifiers: ["gateway-handoff"])

            guard pendingAt > 0,
                  GatewayCore.now - pendingAt < GatewayCore.pendingWindowSeconds
            else { return nil }

            let kind = defaults.string(forKey: GatewayKeys.targetKind) ?? "all"
            let opens = GatewayCore.opensToday()
            var request: [String: Any] = [
                "at": pendingAt,
                "kind": kind,
                "opensToday": opens,
                "pauseSeconds": GatewayCore.pauseSeconds(
                    config: GatewayCore.loadConfig(), opensSoFar: opens),
            ]
            if let token = GatewayCore.encodeForJS(
                kind: kind, tokenData: defaults.data(forKey: GatewayKeys.targetToken)) {
                request["token"] = token
            }
            if let name = defaults.string(forKey: GatewayKeys.targetName) {
                request["appName"] = name
            }
            if let bundleId = defaults.string(forKey: GatewayKeys.targetBundleId) {
                request["bundleId"] = bundleId
            }
            return request
        }

        // The user finished the pause in the app and chose to continue.
        // `scope` "target" lifts the shield only for the app they were
        // opening; "all" lifts every shield (used when there is no specific
        // shield request, e.g. the Shortcuts path).
        AsyncFunction("unlockForSession") { (scope: String) -> [String: Any] in
            guard #available(iOS 16.0, *) else { return [:] }
            return await self.onMain {
                let authorized = AuthorizationCenter.shared.authorizationStatus == .approved
                if authorized, GatewayCore.selectionCount() > 0 {
                    if scope != "target" {
                        GatewayCore.setTarget(kind: "all", tokenData: nil)
                    }
                    GatewayCore.beginSession(store: self.store)
                }
                return self.status(authorized: authorized)
            }
        }

        // ------------------------------------------------------------------
        // Diagnostics
        // ------------------------------------------------------------------

        AsyncFunction("debugState") { () -> String in
            guard #available(iOS 16.0, *) else { return "unavailable" }
            let config = GatewayCore.loadConfig()
            let monitored = DeviceActivityCenter().activities.map { $0.rawValue }
            return [
                "auth=\(AuthorizationCenter.shared.authorizationStatus)",
                "enabled=\(config.enabled)",
                "style=\(config.style)",
                "apps=\(GatewayCore.loadApps().count)",
                "categories=\(GatewayCore.loadCategories().count)",
                "shieldingApps=\(self.store.shield.applications?.count ?? 0)",
                "shieldingCategories=\(self.store.shield.applicationCategories != nil)",
                "opensToday=\(GatewayCore.opensToday())",
                "unlockedFor=\(Int(max(0, GatewayCore.unlockUntil() - GatewayCore.now)))s",
                "monitors=\(monitored)",
                "appGroupOK=\(GatewayCore.defaults != nil)",
            ].joined(separator: " ")
        }

        // ------------------------------------------------------------------
        // Native Views
        // ------------------------------------------------------------------

        View(ShieldedAppView.self) {
            Prop("token") { (view: ShieldedAppView, token: String) in
                view.setToken(token)
            }
        }

    }

    // MARK: - Helpers

    /// ManagedSettingsStore behaves unpredictably off the main thread.
    private func onMain<T>(_ work: @escaping () -> T) async -> T {
        await withCheckedContinuation { continuation in
            DispatchQueue.main.async {
                continuation.resume(returning: work())
            }
        }
    }

    @available(iOS 16.0, *)
    private func enforce() -> [String: Any] {
        let authorized = AuthorizationCenter.shared.authorizationStatus == .approved
        if authorized {
            let rawUntil = GatewayCore.defaults?.double(forKey: GatewayKeys.unlockUntil) ?? 0
            if rawUntil > 0, rawUntil <= GatewayCore.now {
                // The session ran out and nothing else has closed it yet.
                GatewayCore.endSession(store: store, notice: nil)
                DeviceActivityCenter().stopMonitoring([GatewayCore.sessionActivity])
            } else {
                GatewayCore.applyShields(store: store)
            }
            GatewayCore.syncDailyMonitor()
        }
        return status(authorized: authorized)
    }

    @available(iOS 16.0, *)
    private func status(authorized: Bool) -> [String: Any] {
        var canOpenFromShield = false
        if #available(iOS 26.5, *) {
            canOpenFromShield = true
        }
        return [
            "authorized": authorized,
            "selectionCount": GatewayCore.selectionCount(),
            "opensToday": GatewayCore.opensToday(),
            "unlockUntil": GatewayCore.unlockUntil(),
            "canOpenFromShield": canOpenFromShield,
        ]
    }
}

// MARK: - FamilyActivityPicker UIKit wrapper

@available(iOS 16.0, *)
private class FamilyActivityPickerViewController: UIViewController {
    private var selection: FamilyActivitySelection
    private let onDone: (FamilyActivitySelection) -> Void
    private let onCancel: () -> Void
    private var didFinish = false

    init(
        initialSelection: FamilyActivitySelection,
        onDone: @escaping (FamilyActivitySelection) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.selection = initialSelection
        self.onDone = onDone
        self.onCancel = onCancel
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
            rootView: FamilyActivityPickerView(
                selection: binding,
                onDone: { [weak self] in
                    guard let self, !self.didFinish else { return }
                    self.didFinish = true
                    let selection = self.selection
                    self.dismiss(animated: true) { self.onDone(selection) }
                },
                onCancel: { [weak self] in
                    guard let self, !self.didFinish else { return }
                    self.didFinish = true
                    self.dismiss(animated: true) { self.onCancel() }
                }
            )
        )
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        hostingController.didMove(toParent: self)
    }

    // Swiping the sheet away counts as cancelling. Without this the JS
    // promise would never settle.
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed, !didFinish {
            didFinish = true
            onCancel()
        }
    }
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerView: View {
    @Binding var selection: FamilyActivitySelection
    let onDone: () -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Apps to pause")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { onCancel() }
                    }
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
