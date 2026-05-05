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
  debugState(): Promise<string>;
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
  console.log("[FamilyControlsBridge] JS: requestFamilyControlsAuth called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.requestAuthorization();
  console.log(`[FamilyControlsBridge] JS: requestFamilyControlsAuth result: ${result}`);
  return result;
}

export async function getFamilyControlsStatus(): Promise<
  "authorized" | "denied" | "notDetermined"
> {
  console.log("[FamilyControlsBridge] JS: getFamilyControlsStatus called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning notDetermined");
    return "notDetermined";
  }
  const status = await mod.getAuthorizationStatus();
  console.log(`[FamilyControlsBridge] JS: getFamilyControlsStatus result: ${status}`);
  return status;
}

export async function presentAppPicker(): Promise<number> {
  console.log("[FamilyControlsBridge] JS: presentAppPicker called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning 0");
    return 0;
  }
  const result = await mod.presentActivityPicker();
  console.log(`[FamilyControlsBridge] JS: presentAppPicker result (tokens): ${result}`);
  return result;
}

export async function applyShields(): Promise<boolean> {
  console.log("[FamilyControlsBridge] JS: applyShields called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.applyShields();
  console.log(`[FamilyControlsBridge] JS: applyShields result: ${result}`);
  return result;
}

export async function removeShields(): Promise<boolean> {
  console.log("[FamilyControlsBridge] JS: removeShields called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.removeShields();
  console.log(`[FamilyControlsBridge] JS: removeShields result: ${result}`);
  return result;
}

export async function removeShieldsTemporarily(
  durationSeconds: number,
): Promise<boolean> {
  console.log(`[FamilyControlsBridge] JS: removeShieldsTemporarily called with duration: ${durationSeconds}`);
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.removeShieldsTemporarily(durationSeconds);
  console.log(`[FamilyControlsBridge] JS: removeShieldsTemporarily result: ${result}`);
  return result;
}

export async function getShieldedAppCount(): Promise<number> {
  console.log("[FamilyControlsBridge] JS: getShieldedAppCount called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning 0");
    return 0;
  }
  const count = await mod.getShieldedAppCount();
  console.log(`[FamilyControlsBridge] JS: getShieldedAppCount result: ${count}`);
  return count;
}

export async function getShieldedAppTokens(): Promise<string[]> {
  console.log("[FamilyControlsBridge] JS: getShieldedAppTokens called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning empty array");
    return [];
  }
  const tokens = await mod.getShieldedAppTokens();
  console.log(`[FamilyControlsBridge] JS: getShieldedAppTokens result length: ${tokens.length}`);
  return tokens;
}

export async function removeShieldedAppAt(index: number): Promise<boolean> {
  console.log(`[FamilyControlsBridge] JS: removeShieldedAppAt called for index: ${index}`);
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.removeShieldedAppAt(index);
  console.log(`[FamilyControlsBridge] JS: removeShieldedAppAt result: ${result}`);
  return result;
}

export async function clearShieldedApps(): Promise<boolean> {
  console.log("[FamilyControlsBridge] JS: clearShieldedApps called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.clearShieldedApps();
  console.log(`[FamilyControlsBridge] JS: clearShieldedApps result: ${result}`);
  return result;
}

export async function startDoomScrollMonitor(
  firstThresholdMinutes: number,
  secondThresholdMinutes: number,
): Promise<boolean> {
  console.log(`[FamilyControlsBridge] JS: startDoomScrollMonitor called (${firstThresholdMinutes}m, ${secondThresholdMinutes}m)`);
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.startDoomScrollMonitor(
    firstThresholdMinutes,
    secondThresholdMinutes,
  );
  console.log(`[FamilyControlsBridge] JS: startDoomScrollMonitor result: ${result}`);
  return result;
}

export async function stopDoomScrollMonitor(): Promise<boolean> {
  console.log("[FamilyControlsBridge] JS: stopDoomScrollMonitor called");
  const mod = getModule();
  if (!mod) {
    console.log("[FamilyControlsBridge] JS: native module not found, returning false");
    return false;
  }
  const result = await mod.stopDoomScrollMonitor();
  console.log(`[FamilyControlsBridge] JS: stopDoomScrollMonitor result: ${result}`);
  return result;
}

export async function writeSharedGatewayData(
  jsonString: string,
): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  return mod.writeSharedData(jsonString);
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
