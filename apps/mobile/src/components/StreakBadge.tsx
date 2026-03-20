import { Flame } from "lucide-react-native";
import { useEffect, useRef } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { getStreakBadgePresentation } from "./streakBadgeUtils";
import { Text } from "./primitives";

interface StreakBadgeProps {
  count: number;
  size?: "sm" | "lg";
}

export function StreakBadge({
  count,
  size = "sm",
}: StreakBadgeProps) {
  const { successNotification } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const prevCountRef = useRef(count);
  const presentation = getStreakBadgePresentation(count, size);

  useEffect(() => {
    if (count > prevCountRef.current && count > 0) {
      successNotification();

      if (!reducedMotion) {
        scale.value = withSequence(
          withSpring(1.3),
          withSpring(1),
        );
        rotation.value = withSequence(
          withTiming(-10, { duration: 120 }),
          withTiming(10, { duration: 120 }),
          withTiming(0, { duration: 160 }),
        );
      }
    }

    prevCountRef.current = count;
  }, [count, reducedMotion, rotation, scale, successNotification]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      className={`flex-row items-center gap-2 rounded-full ${presentation.containerClass} ${presentation.paddingClass}`}
      style={containerStyle}
    >
      <Animated.View style={flameStyle}>
        <Flame color={presentation.iconColor} size={presentation.iconSize} />
      </Animated.View>
      <Text className={presentation.textClass}>{count}</Text>
    </Animated.View>
  );
}
