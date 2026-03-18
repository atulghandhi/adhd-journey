import { Pressable, Text, View } from "./primitives";

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

export function EmojiRating({ onChange, value }: EmojiRatingProps) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      {ratingOptions.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            className={`h-12 w-12 items-center justify-center rounded-full ${
              selected ? "bg-focuslab-border" : "bg-white"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Text style={{ fontSize: selected ? 30 : 24 }}>{option.emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
