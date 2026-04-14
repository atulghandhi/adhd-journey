import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { AppCard } from "../../components/ui/AppCard";
import { Text, View } from "../../components/primitives";
import { useGatewayStore } from "../../stores/gatewayStore";

export function AppDisruptCard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  const config = useGatewayStore((s) => s.config);
  const getOpenCount = useGatewayStore((s) => s.getOpenCount);
  const completedFirstRun = useGatewayStore((s) => s.completedFirstRun);

  const shieldedCount = config.openLimits.length;
  const isActive = config.enabled && completedFirstRun;

  // Find the most relevant open count to display
  let statusLine = "";
  if (!completedFirstRun) {
    statusLine =
      "Add a breathing pause before distracting apps.";
  } else if (!config.enabled) {
    statusLine = "Paused";
  } else if (shieldedCount > 0) {
    const firstLimit = config.openLimits[0];
    const count = getOpenCount(firstLimit.appId);
    statusLine = `Active · ${shieldedCount} app${shieldedCount !== 1 ? "s" : ""} shielded`;
    if (firstLimit) {
      statusLine += ` · ${count}/${firstLimit.dailyLimit} ${firstLimit.appId}`;
    }
  } else {
    statusLine = "Active — choose apps to shield";
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
