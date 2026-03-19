import { useEffect } from "react";
import type { DimensionValue } from "react-native";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../../hooks/useReducedMotion";

interface SkeletonProps {
  height?: number;
  radius?: number;
  width?: DimensionValue;
}

export function Skeleton({ height = 16, radius = 12, width = "100%" }: SkeletonProps) {
  const opacity = useSharedValue(0.3);
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.4;
      return;
    }

    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ height, width }}>
      <Animated.View
        className="bg-focuslab-border dark:bg-dark-border"
        style={[
          {
            borderRadius: radius,
            flex: 1,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="gap-4 rounded-[22px] bg-white p-5 shadow-sm shadow-black/10 dark:border dark:border-dark-border dark:bg-dark-surface dark:shadow-none">
      <Skeleton height={12} width={100} />
      <Skeleton height={24} width="80%" />
      <Skeleton height={14} />
      <Skeleton height={14} width="60%" />
      <Skeleton height={48} radius={16} />
    </View>
  );
}
