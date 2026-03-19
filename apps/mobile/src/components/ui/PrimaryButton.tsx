import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { REDUCED_MOTION_DURATION, SPRING_SNAPPY } from "../../animations/springs";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Text } from "../primitives";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps extends PropsWithChildren {
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

export function PrimaryButton({
  children,
  disabled,
  loading,
  onPress,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = reducedMotion
      ? withTiming(0.97, { duration: REDUCED_MOTION_DURATION })
      : withSpring(0.97, SPRING_SNAPPY);
  };

  const handlePressOut = () => {
    scale.value = reducedMotion
      ? withTiming(1, { duration: REDUCED_MOTION_DURATION })
      : withSpring(1, SPRING_SNAPPY);
  };

  return (
    <AnimatedPressable
      className={`min-h-12 items-center justify-center rounded-2xl px-5 py-3 ${
        disabled ? "bg-focuslab-border dark:bg-dark-border" : "bg-focuslab-primary"
      }`}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-base font-semibold text-white">{children}</Text>
      )}
    </AnimatedPressable>
  );
}
