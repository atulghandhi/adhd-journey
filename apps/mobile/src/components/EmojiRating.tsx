import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  REDUCED_MOTION_DURATION,
  SPRING_BOUNCE,
  SPRING_MAGNETIC,
  SPRING_QUICK,
} from "../animations/springs";
import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { View } from "./primitives";
import { EmojiText } from "./ui/EmojiText";

const ratingOptions = [
  { emoji: "😫", value: 1 },
  { emoji: "😕", value: 2 },
  { emoji: "😐", value: 3 },
  { emoji: "🙂", value: 4 },
  { emoji: "🤩", value: 5 },
] as const;

interface EmojiRatingProps {
  onChange: (value: number) => void;
  value: number | null;
}

function AnimatedEmoji({
  emoji,
  onPress,
  selected,
}: {
  emoji: string;
  onPress: () => void;
  selected: boolean;
}) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scaleX.value = withTiming(selected ? 1.1 : 1, {
        duration: REDUCED_MOTION_DURATION,
      });
      scaleY.value = withTiming(selected ? 1.1 : 1, {
        duration: REDUCED_MOTION_DURATION,
      });
    } else {
      if (selected) {
        scaleX.value = withSequence(
          withSpring(1.15, SPRING_BOUNCE),
          withSpring(1.1, SPRING_MAGNETIC),
        );
        scaleY.value = withSequence(
          withSpring(0.9, SPRING_BOUNCE),
          withSpring(1.1, SPRING_MAGNETIC),
        );
      } else {
        scaleX.value = withSpring(0.92, SPRING_QUICK);
        scaleY.value = withSpring(0.92, SPRING_QUICK);
      }
    }
  }, [reducedMotion, scaleX, scaleY, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: selected ? 1 : 0.5,
    transform: [
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        className={`h-12 w-12 items-center justify-center rounded-full ${
          selected ? "bg-focuslab-border dark:bg-dark-border" : "bg-white dark:bg-dark-surface"
        }`}
        style={animatedStyle}
      >
        <EmojiText size={24}>{emoji}</EmojiText>
      </Animated.View>
    </Pressable>
  );
}

export function EmojiRating({ onChange, value }: EmojiRatingProps) {
  const { selectionChanged } = useHaptics();

  return (
    <View className="flex-row items-center justify-between gap-2">
      {ratingOptions.map((option) => (
        <AnimatedEmoji
          emoji={option.emoji}
          key={option.value}
          onPress={() => {
            selectionChanged();
            onChange(option.value);
          }}
          selected={option.value === value}
        />
      ))}
    </View>
  );
}
