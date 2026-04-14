import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
} from "react-native-reanimated";
import { ChevronRight, Smartphone, Zap, Shield } from "lucide-react-native";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { NextThingLogo } from "../../components/NextThingLogo";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const DISTRACTING_APPS = [
  "Instagram",
  "TikTok",
  "X (Twitter)",
  "Reddit",
  "Facebook",
  "YouTube",
  "Threads",
  "Snapchat",
];

interface SetupStep {
  body: string;
  detail?: string;
  title: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    title: "Open the Shortcuts app",
    body: "It comes pre-installed on every iPhone. Look for the blue icon with overlapping squares, or search for 'Shortcuts' in Spotlight.",
  },
  {
    title: "Go to the Automation tab",
    body: "Tap 'Automation' at the bottom of the screen. Then tap the + button in the top right corner.",
  },
  {
    title: "Choose 'App' as the trigger",
    body: "Scroll down and tap 'App'. Then select the app you want to add a pause to (like Instagram or TikTok). Make sure 'Is Opened' is selected.",
    detail: "You can select multiple apps at once if you want.",
  },
  {
    title: "Set it to 'Run Immediately'",
    body: "Choose 'Run Immediately' so the pause happens automatically without asking you first. This is what makes it effective.",
  },
  {
    title: "Add the 'Open URL' action",
    body: "Tap 'New Blank Automation', then tap 'Add Action'. Search for 'Open URLs' and select it. In the URL field, type:",
    detail: "nextthing://disrupt",
  },
  {
    title: "Done! Test it out",
    body: "Close Shortcuts, then open the app you selected. Next Thing should appear with a breathing pause before you can continue. That moment of friction is the whole point.",
  },
];

export function DisruptSetupScreen() {
  const router = useRouter();
  const { reducedMotion } = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const isIntro = currentStep === 0;
  const isAndroid = Platform.OS === "android";

  if (isAndroid) {
    return (
      <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 20 }}
        >
          <View className="items-center pt-8">
            <NextThingLogo size={48} />
          </View>

          <Text className="mt-4 text-center text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            App Disrupt
          </Text>
          <Text className="text-center text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            App Disrupt uses iOS Shortcuts Automations to add a mindful pause before
            opening distracting apps. Android support is coming in a future update.
          </Text>

          <View className="mt-4">
            <PrimaryButton onPress={() => router.back()}>
              Go back
            </PrimaryButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 20 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <AnimatedPressable onPress={() => router.back()}>
            <Text className="text-base font-medium text-focuslab-secondary dark:text-dark-text-secondary">
              Close
            </Text>
          </AnimatedPressable>
          {!isIntro ? (
            <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
              Step {currentStep} of {SETUP_STEPS.length}
            </Text>
          ) : null}
        </View>

        {isIntro ? (
          /* Intro screen */
          <Animated.View
            entering={reducedMotion ? undefined : FadeInRight.duration(300)}
            exiting={reducedMotion ? undefined : FadeOutLeft.duration(200)}
            key="intro"
          >
            <View className="items-center pt-6">
              <NextThingLogo size={56} />
            </View>

            <Text className="mt-6 text-center text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              App Disrupt
            </Text>
            <Text className="mt-3 text-center text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Add a 5-second breathing pause before opening apps that steal your focus.
              Research shows this simple friction reduces impulsive app usage by up to 50%.
            </Text>

            <View className="mt-8 gap-4">
              <View className="flex-row items-start gap-4 rounded-2xl bg-white px-4 py-4 dark:bg-dark-surface">
                <Zap color="#40916C" size={22} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                    Instant awareness
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
                    The pause happens automatically when you open a distracting app.
                    No willpower needed.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-4 rounded-2xl bg-white px-4 py-4 dark:bg-dark-surface">
                <Smartphone color="#40916C" size={22} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                    iOS Shortcuts fallback
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
                    For devices without FamilyControls support, we'll walk you through
                    setting up an automation in the Shortcuts app. It takes about 2 minutes.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-4 rounded-2xl bg-white px-4 py-4 dark:bg-dark-surface">
                <Shield color="#40916C" size={22} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                    Your data stays private
                  </Text>
                  <Text className="mt-1 text-sm leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
                    Everything runs on your device. No usage data leaves your phone.
                  </Text>
                </View>
              </View>
            </View>

            <Text className="mt-6 text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Common apps to pause
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {DISTRACTING_APPS.map((appName) => (
                <View
                  key={appName}
                  className="rounded-full border border-focuslab-border bg-white px-3 py-1.5 dark:border-dark-border dark:bg-dark-surface"
                >
                  <Text className="text-sm font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                    {appName}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-8">
              <PrimaryButton onPress={() => setCurrentStep(1)}>
                Set it up now
              </PrimaryButton>
            </View>
          </Animated.View>
        ) : (
          /* Step-by-step guide */
          <Animated.View
            entering={reducedMotion ? undefined : FadeInRight.duration(300)}
            exiting={reducedMotion ? undefined : FadeOutLeft.duration(200)}
            key={`step-${currentStep}`}
          >
            <View className="rounded-2xl bg-white px-5 py-6 dark:bg-dark-surface">
              <View className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-focuslab-primary">
                <Text className="text-lg font-bold text-white">
                  {currentStep}
                </Text>
              </View>

              <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
                {SETUP_STEPS[currentStep - 1].title}
              </Text>

              <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                {SETUP_STEPS[currentStep - 1].body}
              </Text>

              {SETUP_STEPS[currentStep - 1].detail ? (
                <View className="mt-4 rounded-xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
                  <Text className="font-mono text-base font-semibold text-focuslab-primary">
                    {SETUP_STEPS[currentStep - 1].detail}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-6 gap-3">
              {currentStep < SETUP_STEPS.length ? (
                <PrimaryButton onPress={() => setCurrentStep(currentStep + 1)}>
                  Next step
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onPress={() => {
                    router.back();
                  }}
                >
                  Done - I've set it up
                </PrimaryButton>
              )}

              {currentStep > 1 ? (
                <AnimatedPressable onPress={() => setCurrentStep(currentStep - 1)}>
                  <View className="items-center py-2">
                    <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                      Previous step
                    </Text>
                  </View>
                </AnimatedPressable>
              ) : (
                <AnimatedPressable onPress={() => setCurrentStep(0)}>
                  <View className="items-center py-2">
                    <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                      Back to overview
                    </Text>
                  </View>
                </AnimatedPressable>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
