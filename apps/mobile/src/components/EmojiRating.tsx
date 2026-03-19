import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { REDUCED_MOTION_DURATION, SPRING_QUICK, SPRING_SNAPPY } from "../animations/springs";
import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Text, View } from "./primitives";

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
  const scale = useSharedValue(1);
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scale.value = withTiming(selected ? 1.15 : 1, {
        duration: REDUCED_MOTION_DURATION,
      });
    } else {
      scale.value = selected
        ? withSpring(1.3, SPRING_SNAPPY)
        : withSpring(0.85, SPRING_QUICK);
    }
  }, [reducedMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: selected ? 1 : 0.5,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        className={`h-12 w-12 items-center justify-center rounded-full ${
          selected ? "bg-focuslab-border dark:bg-dark-border" : "bg-white dark:bg-dark-surface"
        }`}
        style={animatedStyle}
      >
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
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
