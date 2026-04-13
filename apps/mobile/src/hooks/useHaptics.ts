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

  const heavyImpact = useCallback(() => {
    if (reducedMotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [reducedMotion]);

  const successNotification = useCallback(() => {
    if (reducedMotion) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [reducedMotion]);

  const completionSequence = useCallback(() => {
    if (reducedMotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
    setTimeout(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      160,
    );
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
    completionSequence,
    errorNotification,
    heavyImpact,
    lightImpact,
    mediumImpact,
    selectionChanged,
    successNotification,
  };
}
