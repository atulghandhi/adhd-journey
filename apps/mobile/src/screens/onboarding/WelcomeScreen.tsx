import { useRouter } from "expo-router";

import { SafeAreaView, Text, View } from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <View className="flex-1 justify-between px-6 py-8">
        <View className="gap-6">
          <Text className="text-4xl font-bold leading-tight text-focuslab-primaryDark">
            FocusLab helps you build attention one doable day at a time.
          </Text>
          <Text className="text-lg leading-8 text-focuslab-secondary">
            You won&apos;t get a wall of advice. You&apos;ll get one small task, one
            honest reflection, and steady momentum.
          </Text>
        </View>
        <View className="rounded-[28px] bg-white p-6">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
            Under 60 seconds
          </Text>
          <Text className="mt-3 text-lg leading-7 text-focuslab-primaryDark">
            Three quick screens and then we take you straight to Day 1.
          </Text>
          <View className="mt-6">
            <PrimaryButton onPress={() => router.push("/onboarding/name" as never)}>
              Let&apos;s start
            </PrimaryButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
