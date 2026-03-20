import type { LayoutChangeEvent } from "react-native";
import { useEffect, useMemo, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { REDUCED_MOTION_DURATION, SPRING_QUICK } from "../../animations/springs";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Text, View } from "../primitives";

const CONTROL_PADDING = 4;

interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  disabled?: boolean;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  value: T;
}

export function SegmentedControl<T extends string>({
  disabled = false,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  const { reducedMotion } = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);
  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value],
  );
  const segmentWidth = containerWidth > 0 ? containerWidth / options.length : 0;
  const indicatorWidth = Math.max(0, segmentWidth - CONTROL_PADDING * 2);

  useEffect(() => {
    if (segmentWidth === 0) {
      return;
    }

    const nextTranslateX = selectedIndex * segmentWidth + CONTROL_PADDING;

    if (reducedMotion) {
      translateX.value = withTiming(nextTranslateX, {
        duration: REDUCED_MOTION_DURATION,
      });
      return;
    }

    translateX.value = withSpring(nextTranslateX, {
      ...SPRING_QUICK,
      overshootClamping: true,
    });
  }, [reducedMotion, segmentWidth, selectedIndex, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      className="rounded-2xl bg-focuslab-border p-1 dark:bg-dark-border"
      onLayout={handleLayout}
    >
      {containerWidth > 0 ? (
        <Animated.View
          className="absolute bottom-1 top-1 rounded-xl bg-white shadow-sm shadow-black/10 dark:bg-dark-surface dark:shadow-none"
          style={[
            {
              left: 0,
              width: indicatorWidth,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      <View className="flex-row">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <AnimatedPressable
              className="flex-1 items-center rounded-xl py-2.5"
              disabled={disabled || isSelected}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={`text-base ${
                  isSelected
                    ? "font-semibold text-focuslab-primaryDark dark:text-dark-text-primary"
                    : "font-medium text-focuslab-secondary dark:text-dark-text-secondary"
                }`}
              >
                {option.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
