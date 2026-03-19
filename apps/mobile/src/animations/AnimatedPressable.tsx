import type { PropsWithChildren } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { REDUCED_MOTION_DURATION, SPRING_SNAPPY } from "./springs";

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
  const scale = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (reducedMotion) {
      scale.value = withTiming(0.97, { duration: REDUCED_MOTION_DURATION });
    } else {
      scale.value = withSpring(0.97, SPRING_SNAPPY);
    }
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      scale.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
    } else {
      scale.value = withSpring(1, SPRING_SNAPPY);
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
