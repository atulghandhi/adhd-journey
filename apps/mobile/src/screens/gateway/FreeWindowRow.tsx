import { Pressable, TextInput } from "react-native";
import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import type { TimeWindow } from "@focuslab/shared";

import { Text, View } from "../../components/primitives";

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitizeHHMM(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  return HHMM_REGEX.test(trimmed) ? trimmed : fallback;
}

interface Props {
  onRemove: () => void;
  onUpdate: (window: TimeWindow) => void;
  window: TimeWindow;
}

export function FreeWindowRow({ onRemove, onUpdate, window }: Props) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
      <TextInput
        className="w-16 text-center text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary"
        defaultValue={window.start}
        onEndEditing={(e) =>
          onUpdate({ ...window, start: sanitizeHHMM(e.nativeEvent.text, window.start) })
        }
        placeholder="17:00"
        placeholderTextColor={dark ? "#6B8F7F" : "#999"}
      />
      <Text className="text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        —
      </Text>
      <TextInput
        className="w-16 text-center text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary"
        defaultValue={window.end}
        onEndEditing={(e) =>
          onUpdate({ ...window, end: sanitizeHHMM(e.nativeEvent.text, window.end) })
        }
        placeholder="20:00"
        placeholderTextColor={dark ? "#6B8F7F" : "#999"}
      />
      <View className="flex-1" />
      <Pressable onPress={onRemove}>
        <X color={dark ? "#C9E4D6" : "#52796F"} size={16} />
      </Pressable>
    </View>
  );
}
