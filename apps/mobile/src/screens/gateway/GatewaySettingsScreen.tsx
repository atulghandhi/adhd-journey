import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { SafeAreaView, ScrollView, Text, View } from "../../components/primitives";
import { useGatewayStore } from "../../stores/gatewayStore";
import { AppDisruptSettings } from "./AppDisruptSettings";

export function GatewaySettingsScreen() {
  const router = useRouter();
  const { firstRun } = useLocalSearchParams<{ firstRun?: string }>();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  const completedFirstRun = useGatewayStore((s) => s.completedFirstRun);
  const markFirstRunComplete = useGatewayStore((s) => s.markFirstRunComplete);

  // Setup happens on this one screen, so arriving here is the first run.
  useEffect(() => {
    if (!completedFirstRun && firstRun === "true") {
      markFirstRunComplete();
    }
  }, [completedFirstRun, firstRun, markFirstRunComplete]);

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6 flex-row items-center gap-3">
          <AnimatedPressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/journey" as never);
              }
            }}
          >
            <ChevronLeft color={dark ? "#C9E4D6" : "#52796F"} size={24} />
          </AnimatedPressable>
          <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Back
          </Text>
        </View>

        <AppDisruptSettings />
      </ScrollView>
    </SafeAreaView>
  );
}
