import { Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import type { OpenLimitConfig } from "@focuslab/shared";

import { Text, View } from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";

interface Props {
  limit: OpenLimitConfig;
  onUpdate: (dailyLimit: number) => void;
}

export function OpenLimitRow({ limit, onUpdate }: Props) {
  const { colorScheme } = useColorScheme();
  const { selectionChanged } = useHaptics();
  const dark = colorScheme === "dark";
  const iconColor = dark ? "#C9E4D6" : "#52796F";

  return (
    <View className="flex-row items-center justify-between rounded-xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
      <Text className="text-sm font-medium capitalize text-focuslab-primaryDark dark:text-dark-text-primary">
        {limit.appId === "shielded_apps" ? "Shielded apps" : limit.appId}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            selectionChanged();
            onUpdate(Math.max(1, limit.dailyLimit - 1));
          }}
        >
          <Minus color={iconColor} size={16} />
        </Pressable>
        <Text className="w-12 text-center text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
          {limit.dailyLimit}/day
        </Text>
        <Pressable
          onPress={() => {
            selectionChanged();
            onUpdate(Math.min(50, limit.dailyLimit + 1));
          }}
        >
          <Plus color={iconColor} size={16} />
        </Pressable>
      </View>
    </View>
  );
}
