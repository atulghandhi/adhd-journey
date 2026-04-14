import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  REDUCED_MOTION_DURATION,
  SPRING_QUICK,
  SPRING_SQUISH,
} from "../animations/springs";
import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TabBarButton({
  children,
  onPress,
  style,
  accessibilityState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ref: _ref,
  ...rest
}: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();
  const { selectionChanged } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      accessibilityState={accessibilityState}
      onPress={(e) => {
        if (!accessibilityState?.selected) {
          selectionChanged();
          if (reducedMotion) {
            scale.value = withTiming(0.92, { duration: REDUCED_MOTION_DURATION });
            scale.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
          } else {
            scale.value = withSpring(0.85, SPRING_SQUISH);
            scale.value = withSpring(1, SPRING_QUICK);
          }
        }
        onPress?.(e);
      }}
      onPressIn={() => {
        if (reducedMotion) {
          scale.value = withTiming(0.92, { duration: REDUCED_MOTION_DURATION });
        } else {
          scale.value = withSpring(0.85, SPRING_SQUISH);
        }
      }}
      onPressOut={() => {
        if (reducedMotion) {
          scale.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
        } else {
          scale.value = withSpring(1, SPRING_QUICK);
        }
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
