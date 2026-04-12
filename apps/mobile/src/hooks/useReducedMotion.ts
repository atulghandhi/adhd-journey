import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useProfilePreferences } from "./useProfilePreferences";

export function useReducedMotion() {
  const { preferences } = useProfilePreferences();
  const [deviceReducedMotion, setDeviceReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setDeviceReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setDeviceReducedMotion
    );
    return () => subscription.remove();
  }, []);

  return { reducedMotion: deviceReducedMotion || preferences.reducedMotion };
}
