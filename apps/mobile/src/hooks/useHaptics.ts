import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { useReducedMotion } from "./useReducedMotion";

export function useHaptics() {
  const { reducedMotion } = useReducedMotion();

  const lightImpact = useCallback(() => {
    if (reducedMotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reducedMotion]);

  const mediumImpact = useCallback(() => {
    if (reducedMotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [reducedMotion]);

  const successNotification = useCallback(() => {
    if (reducedMotion) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [reducedMotion]);

  const errorNotification = useCallback(() => {
    if (reducedMotion) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [reducedMotion]);

  const selectionChanged = useCallback(() => {
    if (reducedMotion) return;
    Haptics.selectionAsync();
  }, [reducedMotion]);

  return {
    errorNotification,
    lightImpact,
    mediumImpact,
    selectionChanged,
    successNotification,
  };
}
