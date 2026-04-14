import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// FamilyControls bridge — wraps native Swift module.
// On non-iOS or iOS < 16, all methods are no-ops that return safe defaults.
// ---------------------------------------------------------------------------

interface FamilyControlsModule {
  requestAuthorization(): Promise<boolean>;
  getAuthorizationStatus(): Promise<"authorized" | "denied" | "notDetermined">;
  presentActivityPicker(): Promise<boolean>;
  applyShields(): Promise<boolean>;
  removeShields(): Promise<boolean>;
  removeShieldsTemporarily(durationSeconds: number): Promise<boolean>;
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./src/FamilyControlsBridgeModule");
    nativeModule = mod.default ?? mod;
    return nativeModule;
  } catch {
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

export async function presentAppPicker(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
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

export { isAvailable as isFamilyControlsAvailable };
