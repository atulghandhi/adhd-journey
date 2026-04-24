import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import { Platform, ViewProps } from "react-native";

// ---------------------------------------------------------------------------
// FamilyControls bridge — wraps native Swift module.
// On non-iOS or iOS < 16, all methods are no-ops that return safe defaults.
// ---------------------------------------------------------------------------

interface FamilyControlsModule {
// ... rest of interface
  requestAuthorization(): Promise<boolean>;
  getAuthorizationStatus(): Promise<"authorized" | "denied" | "notDetermined">;
  presentActivityPicker(): Promise<number>;
  applyShields(): Promise<boolean>;
  removeShields(): Promise<boolean>;
  removeShieldsTemporarily(durationSeconds: number): Promise<boolean>;
  getShieldedAppCount(): Promise<number>;
  getShieldedAppTokens(): Promise<string[]>;
  removeShieldedAppAt(index: number): Promise<boolean>;
  clearShieldedApps(): Promise<boolean>;
  startDoomScrollMonitor(
    firstThresholdMinutes: number,
    secondThresholdMinutes: number,
  ): Promise<boolean>;
  stopDoomScrollMonitor(): Promise<boolean>;
  writeSharedData(jsonString: string): Promise<boolean>;
}

let nativeModule: FamilyControlsModule | null = null;

function isAvailable(): boolean {
  return Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 16;
}

function getModule(): FamilyControlsModule | null {
  if (!isAvailable()) return null;
  if (nativeModule) return nativeModule;

  try {
    // The native module is registered by its `Name(...)` in the Swift
    // `ModuleDefinition` — see FamilyControlsBridgeModule.swift.
    nativeModule = requireNativeModule<FamilyControlsModule>("FamilyControlsBridge");
    return nativeModule;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[FamilyControlsBridge] native module not available:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function requestFamilyControlsAuth(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.requestAuthorization();
}

export async function getFamilyControlsStatus(): Promise<
  "authorized" | "denied" | "notDetermined"
> {
  const mod = getModule();
  if (!mod) return "notDetermined";
  return mod.getAuthorizationStatus();
}

export async function presentAppPicker(): Promise<number> {
  const mod = getModule();
  if (!mod) return 0;
  return mod.presentActivityPicker();
}

export async function applyShields(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.applyShields();
}

export async function removeShields(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.removeShields();
}

export async function removeShieldsTemporarily(
  durationSeconds: number,
): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.removeShieldsTemporarily(durationSeconds);
}

export async function getShieldedAppCount(): Promise<number> {
  const mod = getModule();
  if (!mod) return 0;
  return mod.getShieldedAppCount();
}

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

export async function clearShieldedApps(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.clearShieldedApps();
}

export async function startDoomScrollMonitor(
  firstThresholdMinutes: number,
  secondThresholdMinutes: number,
): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.startDoomScrollMonitor(
    firstThresholdMinutes,
    secondThresholdMinutes,
  );
}

export async function stopDoomScrollMonitor(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.stopDoomScrollMonitor();
}

export async function writeSharedGatewayData(
  jsonString: string,
): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.writeSharedData(jsonString);
}

export interface ShieldedAppViewProps extends ViewProps {
  token: string;
}

export const ShieldedAppView: React.ComponentType<ShieldedAppViewProps> =
  isAvailable()
    ? requireNativeViewManager("FamilyControlsBridge")
    : () => null;

export { isAvailable as isFamilyControlsAvailable };
