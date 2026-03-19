import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { useProfilePreferences } from "./useProfilePreferences";

export function useReducedMotion() {
  const [osReducedMotion, setOsReducedMotion] = useState(false);
  const { preferences } = useProfilePreferences();

  useEffect(() => {
    const check = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setOsReducedMotion(enabled);
    };
    check();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setOsReducedMotion,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const reducedMotion = osReducedMotion || preferences.reducedMotion === true;

  return { reducedMotion };
}
