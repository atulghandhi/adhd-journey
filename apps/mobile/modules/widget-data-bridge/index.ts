import { Platform } from "react-native";

export type PendingDeepLink = { link: string; at: number };

let WidgetDataBridge: {
  setWidgetData: (jsonString: string) => boolean;
  clearWidgetData: () => boolean;
  readPendingDeepLink: (clear: boolean) => PendingDeepLink | null;
  clearPendingDeepLink: () => boolean;
} | null = null;

if (Platform.OS === "ios") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core");
    WidgetDataBridge = requireNativeModule("WidgetDataBridge");
  } catch {
    // Module not available (e.g. Expo Go, Android, web)
    WidgetDataBridge = null;
  }
}

/**
 * Write a JSON string to the shared App Group UserDefaults
 * and reload all WidgetKit timelines.
 */
export function setWidgetData(jsonString: string): boolean {
  if (!WidgetDataBridge) return false;
  return WidgetDataBridge.setWidgetData(jsonString);
}

/**
 * Clear widget data and reload timelines.
 */
export function clearWidgetData(): boolean {
  if (!WidgetDataBridge) return false;
  return WidgetDataBridge.clearWidgetData();
}

/**
 * Read (and optionally consume) a deep-link written by the ShieldAction
 * extension. Returns null if nothing pending or module is unavailable.
 */
export function readPendingDeepLink(options?: { clear?: boolean }): PendingDeepLink | null {
  if (!WidgetDataBridge) return null;
  return WidgetDataBridge.readPendingDeepLink(options?.clear ?? true);
}

export function clearPendingDeepLink(): boolean {
  if (!WidgetDataBridge) return false;
  return WidgetDataBridge.clearPendingDeepLink();
}
