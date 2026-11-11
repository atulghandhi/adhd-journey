import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import { Platform, ViewProps } from "react-native";

import type { NativeGatewayConfig } from "@focuslab/shared";

// ---------------------------------------------------------------------------
// FamilyControls bridge: wraps the native Swift module.
// On non-iOS or iOS < 16, every call resolves to a safe default.
// ---------------------------------------------------------------------------

export type FamilyControlsAuthStatus = "authorized" | "denied" | "notDetermined";

/** What the device is actually doing right now, as reported by native. */
export interface GatewayStatus {
  /** Screen Time permission has been granted. */
  authorized: boolean;
  /**
   * iOS 26.5+: the shield's button can open Next Thing directly. On older
   * versions the shield falls back to a notification or an in-shield pause.
   */
  canOpenFromShield: boolean;
  /** Paused apps opened today (counted when a pause ends in "continue"). */
  opensToday: number;
  /** Number of apps + categories the user has selected. */
  selectionCount: number;
  /** Epoch seconds when the current unlock session ends, or 0. */
  unlockUntil: number;
}

/** A hand-off from the shield: the user tapped "Take a breath". */
export interface PendingShieldRequest {
  /** Display name of the app, when iOS shared it. */
  appName?: string;
  /** Epoch seconds when the shield button was tapped. */
  at: number;
  /** Bundle id of the app, when iOS shared it. */
  bundleId?: string;
  kind: "all" | "app" | "category";
  opensToday: number;
  /** The pause to run, computed natively so it matches the shield's text. */
  pauseSeconds: number;
  /** Opaque token for `ShieldedAppView` ("app:..." / "category:..."). */
  token?: string;
}

interface FamilyControlsModule {
  consumePendingShieldRequest(): Promise<PendingShieldRequest | null>;
  debugState(): Promise<string>;
  getAuthorizationStatus(): Promise<FamilyControlsAuthStatus>;
  getShieldedAppTokens(): Promise<string[]>;
  presentActivityPicker(): Promise<number>;
  removeShieldedAppAt(index: number): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  syncGateway(configJSON: string): Promise<Partial<GatewayStatus>>;
  unlockForSession(scope: "all" | "target"): Promise<Partial<GatewayStatus>>;
}

let nativeModule: FamilyControlsModule | null = null;

function isAvailable(): boolean {
  return Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 16;
}

function getModule(): FamilyControlsModule | null {
  if (!isAvailable()) return null;
  if (nativeModule) return nativeModule;

  try {
    // Registered by its `Name(...)` in FamilyControlsBridgeModule.swift.
    nativeModule = requireNativeModule<FamilyControlsModule>("FamilyControlsBridge");
    return nativeModule;
  } catch (err) {
    console.warn("[FamilyControlsBridge] native module not available:", err);
    return null;
  }
}

/**
 * The native layer answers with an empty object when it cannot run (old iOS).
 * Treat anything without the expected fields as "no status".
 */
function toStatus(raw: Partial<GatewayStatus> | null | undefined): GatewayStatus | null {
  if (!raw || typeof raw.authorized !== "boolean") return null;

  return {
    authorized: raw.authorized,
    canOpenFromShield: raw.canOpenFromShield === true,
    opensToday: raw.opensToday ?? 0,
    selectionCount: raw.selectionCount ?? 0,
    unlockUntil: raw.unlockUntil ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function requestFamilyControlsAuth(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.requestAuthorization();
}

export async function getFamilyControlsStatus(): Promise<FamilyControlsAuthStatus> {
  const mod = getModule();
  if (!mod) return "notDetermined";
  return mod.getAuthorizationStatus();
}

/**
 * Show Apple's app picker. Resolves with the number of apps and categories
 * selected, or -1 if the user backed out without confirming.
 */
export async function presentAppPicker(): Promise<number> {
  const mod = getModule();
  if (!mod) return -1;
  return mod.presentActivityPicker();
}

/** The selection as opaque tokens for `ShieldedAppView`. */
export async function getShieldedAppTokens(): Promise<string[]> {
  const mod = getModule();
  if (!mod) return [];
  return mod.getShieldedAppTokens();
}

export async function removeShieldedAppAt(index: number): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.removeShieldedAppAt(index);
}

/**
 * Hand the settings to the native layer and make the device match them:
 * shields on or off, an expired unlock session closed, the usage monitor
 * restarted if its inputs changed. Safe to call on every launch, foreground
 * and settings change.
 */
export async function syncGateway(
  config: NativeGatewayConfig,
): Promise<GatewayStatus | null> {
  const mod = getModule();
  if (!mod) return null;
  return toStatus(await mod.syncGateway(JSON.stringify(config)));
}

/**
 * Pick up the request the shield left when the user tapped "Take a breath".
 * Call whenever the app becomes active. Reading it also tells the shield the
 * hand-off worked.
 */
export async function consumePendingShieldRequest(): Promise<PendingShieldRequest | null> {
  const mod = getModule();
  if (!mod) return null;
  return (await mod.consumePendingShieldRequest()) ?? null;
}

/**
 * Lift the shield for the configured session length. "target" lifts it only
 * for the app the user was opening; "all" lifts every shield.
 */
export async function unlockForSession(
  scope: "all" | "target",
): Promise<GatewayStatus | null> {
  const mod = getModule();
  if (!mod) return null;
  return toStatus(await mod.unlockForSession(scope));
}

export async function debugFamilyControlsState(): Promise<string> {
  const mod = getModule();
  if (!mod) return "unavailable";
  return mod.debugState();
}

export interface ShieldedAppViewProps extends ViewProps {
  token: string;
}

export const ShieldedAppView: React.ComponentType<ShieldedAppViewProps> =
  isAvailable()
    ? requireNativeViewManager("FamilyControlsBridge")
    : () => null;

export { isAvailable as isFamilyControlsAvailable };
