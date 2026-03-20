import { AnimatedPressable } from "../animations/AnimatedPressable";
import { Text } from "./primitives";
import { EmojiText } from "./ui/EmojiText";

interface ReactionPillProps {
  active: boolean;
  count: number;
  emoji: string;
  onPress: () => void;
}

export function ReactionPill({
  active,
  count,
  emoji,
  onPress,
}: ReactionPillProps) {
  return (
    <AnimatedPressable
      className={`min-h-[36px] flex-row items-center justify-center gap-1.5 rounded-full px-3 py-2 ${
        active ? "bg-focuslab-primary" : "bg-focuslab-border dark:bg-dark-border"
      }`}
      onPress={onPress}
    >
      <EmojiText size={18}>{emoji}</EmojiText>
      {count > 0 ? (
        <Text
          className={`text-sm font-medium ${
            active
              ? "text-white"
              : "text-focuslab-primaryDark dark:text-dark-text-primary"
          }`}
        >
          {count}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}
