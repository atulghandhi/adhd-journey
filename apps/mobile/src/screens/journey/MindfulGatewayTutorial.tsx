import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

const iosSteps = [
  "Open Shortcuts and tap Automation.",
  "Create a personal automation for opening your top trigger app.",
  "Add a five-second breathing or wait step before the app action.",
  "Save it and test opening the app once.",
];

const androidSteps = [
  "Open your automation or digital wellbeing tools.",
  "Create a routine tied to your top trigger app.",
  "Add a five-second breathing or pause screen before launch.",
  "Run one test so the pause feels automatic tomorrow.",
];

export function MindfulGatewayTutorial() {
  const steps = Platform.OS === "ios" ? iosSteps : androidSteps;

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Mindful gateway
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Add a five-second pause before the scroll starts.
          </Text>
        </View>

        {steps.map((step, index) => (
          <AppCard key={step}>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Step {index + 1}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-primaryDark dark:text-dark-text-primary">
              {step}
            </Text>
          </AppCard>
        ))}

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Test it now
          </Text>
          <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            Try opening the app you chose once. If you see the breathing pause,
            the gateway is set.
          </Text>
          <View className="mt-4 gap-3">
            <PrimaryButton
              onPress={() => {
                void Linking.openURL(
                  Platform.OS === "ios" ? "shortcuts://" : "app-settings:",
                );
              }}
            >
              Open setup tools
            </PrimaryButton>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
