import type { PropsWithChildren } from "react";
import { useCallback } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { REDUCED_MOTION_DURATION, SPRING_SNAPPY } from "./springs";

interface AnimatedCheckInPopProps extends PropsWithChildren {
  onPop?: () => void;
}

export function useCheckInPop() {
  const scale = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  const pop = useCallback(() => {
    if (reducedMotion) {
      scale.value = withSequence(
        withTiming(1.05, { duration: REDUCED_MOTION_DURATION / 2 }),
        withTiming(1, { duration: REDUCED_MOTION_DURATION / 2 }),
      );
    } else {
      scale.value = withSequence(
        withSpring(1.15, SPRING_SNAPPY),
        withSpring(1, SPRING_SNAPPY),
      );
    }
  }, [reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, pop };
}

export function AnimatedCheckInPop({ children }: AnimatedCheckInPopProps) {
  const { animatedStyle } = useCheckInPop();

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
