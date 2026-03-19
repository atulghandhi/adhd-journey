import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { REDUCED_MOTION_DURATION, SPRING_DEFAULT } from "./springs";

interface AnimatedCardEntranceProps extends PropsWithChildren {
  delay?: number;
}

export function AnimatedCardEntrance({
  children,
  delay = 0,
}: AnimatedCardEntranceProps) {
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.97);
  const opacity = useSharedValue(0);
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = 0;
      scale.value = 1;
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: REDUCED_MOTION_DURATION }),
      );
    } else {
      translateY.value = withDelay(delay, withSpring(0, SPRING_DEFAULT));
      scale.value = withDelay(delay, withSpring(1, SPRING_DEFAULT));
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 150 }),
      );
    }
  }, [delay, opacity, reducedMotion, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
