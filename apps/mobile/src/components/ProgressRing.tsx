import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import { Circle, Svg } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { REDUCED_MOTION_DURATION, SPRING_GENTLE } from "../animations/springs";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Text, View } from "./primitives";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  completed: number;
  size?: number;
  strokeWidth?: number;
  total: number;
}

export function ProgressRing({
  completed,
  size = 120,
  strokeWidth = 10,
  total,
}: ProgressRingProps) {
  const { colorScheme } = useColorScheme();
  const { reducedMotion } = useReducedMotion();
  const isDark = colorScheme === "dark";
  const safeTotal = Math.max(total, 1);
  const displayTotal = Math.max(total, 0);
  const displayCompleted = Math.max(0, Math.min(completed, displayTotal));
  const progress = displayCompleted / safeTotal;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - progress);
  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    if (reducedMotion) {
      strokeDashoffset.value = withTiming(targetOffset, {
        duration: REDUCED_MOTION_DURATION,
      });
      return;
    }

    strokeDashoffset.value = withSpring(targetOffset, {
      ...SPRING_GENTLE,
      overshootClamping: true,
    });
  }, [reducedMotion, strokeDashoffset, targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  return (
    <View
      accessibilityLabel={`Progress ${displayCompleted} of ${displayTotal}`}
      className="items-center justify-center"
      style={{ height: size, width: size }}
    >
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={isDark ? "#2D6A4F" : "#D8F3DC"}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="#40916C"
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="text-2xl font-bold"
          style={{ color: isDark ? "#E8F5E9" : "#1B4332" }}
        >
          {displayCompleted}/{displayTotal}
        </Text>
      </View>
    </View>
  );
}
