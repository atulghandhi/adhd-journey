import { Flame } from "lucide-react-native";
import { Text, View } from "./primitives";

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-[#22C55E] px-3 py-2">
      <Flame color="#FFFFFF" size={14} />
      <Text className="font-semibold text-sm text-white">{count}</Text>
    </View>
  );
}
