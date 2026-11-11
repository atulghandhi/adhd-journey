import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { AppCard } from "../../components/ui/AppCard";
import { Text, View } from "../../components/primitives";
import { SHIELDED_APPS_ID, useGatewayStore } from "../../stores/gatewayStore";

export function AppDisruptCard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  const enabled = useGatewayStore((s) => s.config.enabled);
  const completedFirstRun = useGatewayStore((s) => s.completedFirstRun);
  const selectionCount = useGatewayStore((s) => s.nativeStatus?.selectionCount);
  const opensToday = useGatewayStore((s) => s.getOpenCount(SHIELDED_APPS_ID));

  let statusLine: string;
  if (!completedFirstRun) {
    statusLine = "Add a breathing pause before distracting apps.";
  } else if (!enabled) {
    statusLine = "Off";
  } else if (selectionCount === 0) {
    statusLine = "On · choose apps to pause";
  } else {
    statusLine = `On · ${opensToday} open${opensToday === 1 ? "" : "s"} today`;
  }

  return (
    <AnimatedPressable
      onPress={() =>
        router.push(
          completedFirstRun
            ? ("/gateway-settings" as never)
            : ("/gateway-settings?firstRun=true" as never),
        )
      }
    >
      <AppCard>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              🧘 App Disrupt
            </Text>
            <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
              {statusLine}
            </Text>
          </View>
          <ChevronRight color={dark ? "#C9E4D6" : "#52796F"} size={20} />
        </View>
      </AppCard>
    </AnimatedPressable>
  );
}
