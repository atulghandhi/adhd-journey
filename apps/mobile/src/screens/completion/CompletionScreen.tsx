import { useRouter } from "expo-router";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useProfile } from "../../hooks/useProfile";

export function CompletionScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: journeyState } = useJourneyState();

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <AppCard>
          <Text className="text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            You finished the journey.
          </Text>
          <Text className="mt-4 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            You said you wanted to: {profile?.motivating_answer ?? "build real focus"}.
          </Text>
          <Text className="mt-4 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            Completed tasks: {journeyState?.completedCount ?? 0}
          </Text>
          <Text className="mt-1 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            Current streak: {journeyState?.streakCount ?? 0}
          </Text>
          <View className="mt-6 gap-3">
            <PrimaryButton onPress={() => router.push("/completion/quiz" as never)}>
              Take the knowledge quiz
            </PrimaryButton>
            <PrimaryButton
              onPress={() => router.push("/completion/resources" as never)}
            >
              Open the resource bundle
            </PrimaryButton>
            <PrimaryButton onPress={() => router.replace("/journey" as never)}>
              Return to the journey
            </PrimaryButton>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
