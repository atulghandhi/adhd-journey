import type { PropsWithChildren } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  REDUCED_MOTION_DURATION,
  SPRING_MAGNETIC,
  SPRING_SQUISH,
} from "./springs";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PropsWithChildren {
  className?: string;
  disabled?: boolean;
  onPress?: () => void;
}

export function AnimatedPressable({
  children,
  className,
  disabled,
  onPress,
}: AnimatedPressableProps) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const opacity = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const handlePressIn = () => {
    if (reducedMotion) {
      scaleX.value = withTiming(0.98, { duration: REDUCED_MOTION_DURATION });
      scaleY.value = withTiming(0.98, { duration: REDUCED_MOTION_DURATION });
    } else {
      scaleX.value = withSpring(1.02, SPRING_SQUISH);
      scaleY.value = withSpring(0.96, SPRING_SQUISH);
      opacity.value = withTiming(0.92, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      scaleX.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
      scaleY.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
    } else {
      scaleX.value = withSpring(1, SPRING_MAGNETIC);
      scaleY.value = withSpring(1, SPRING_MAGNETIC);
      opacity.value = withSpring(1, SPRING_MAGNETIC);
    }
  };

  return (
    <AnimatedPressableBase
      className={className}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressableBase>
  );
}
