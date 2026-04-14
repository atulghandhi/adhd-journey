import { useState } from "react";
import { Pressable } from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

import { DEFAULT_GATEWAY_CONFIG } from "@focuslab/shared";
import type { OpenLimitConfig } from "@focuslab/shared";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { NextThingLogo } from "../../components/NextThingLogo";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useGatewayStore } from "../../stores/gatewayStore";
import {
  isFamilyControlsAvailable,
  presentAppPicker,
  requestFamilyControlsAuth,
  applyShields,
  startDoomScrollMonitor,
} from "../../../modules/family-controls-bridge";
import { OpenLimitRow } from "./OpenLimitRow";

const SUGGESTED_APPS = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "reddit",
  "facebook",
  "snapchat",
];

interface Props {
  onComplete: () => void;
}

export function GatewayFirstRunFlow({ onComplete }: Props) {
  const { reducedMotion } = useReducedMotion();
  const { lightImpact, mediumImpact, successNotification } = useHaptics();
  const updateConfig = useGatewayStore((s) => s.updateConfig);
  const setFamilyControlsAuthorized = useGatewayStore(
    (s) => s.setFamilyControlsAuthorized,
  );

  const [step, setStep] = useState(0);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [limits, setLimits] = useState<OpenLimitConfig[]>([]);

  const enterAnim = reducedMotion ? undefined : FadeInRight.duration(300);
  const exitAnim = reducedMotion ? undefined : FadeOutLeft.duration(200);

  // Step 0: Pick apps (FamilyActivityPicker on iOS 16+, manual on older)
  if (step === 0) {
    return (
      <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
        <ScrollView
          contentContainerStyle={{ gap: 20, padding: 24 }}
        >
          <Animated.View entering={enterAnim} exiting={exitAnim} key="step-0">
            <View className="items-center pt-4">
              <NextThingLogo size={48} />
            </View>

            <Text className="mt-6 text-center text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              Pick your trigger apps
            </Text>
            <Text className="mt-2 text-center text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Which apps steal your focus? A breathing pause will appear before
              you open them.
            </Text>

            {isFamilyControlsAvailable() ? (
              <PrimaryButton
                onPress={async () => {
                  mediumImpact();
                  const granted = await requestFamilyControlsAuth();
                  setFamilyControlsAuthorized(granted);
                  if (granted) {
                    const appCount = await presentAppPicker();
                    if (appCount > 0) {
                      // Create one generic limit entry per selected app
                      const defaultLimits: OpenLimitConfig[] = Array.from(
                        { length: appCount },
                        (_, i) => ({
                          appId: `app_${i + 1}`,
                          dailyLimit: 5,
                          enabled: true,
                        }),
                      );
                      setLimits(defaultLimits);
                      setStep(1);
                    }
                  }
                }}
              >
                Choose apps from your phone
              </PrimaryButton>
            ) : (
              <View className="mt-4 gap-2">
                <Text className="text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                  Select apps to add a breathing pause:
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {SUGGESTED_APPS.map((app) => {
                    const selected = selectedApps.includes(app);
                    return (
                      <Pressable
                        key={app}
                        onPress={() => {
                          lightImpact();
                          setSelectedApps((prev) =>
                            selected
                              ? prev.filter((a) => a !== app)
                              : [...prev, app],
                          );
                        }}
                      >
                        <View
                          className={`rounded-full border px-4 py-2 ${
                            selected
                              ? "border-focuslab-primary bg-focuslab-primary/15"
                              : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-surface"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium capitalize ${
                              selected
                                ? "text-focuslab-primary"
                                : "text-focuslab-primaryDark dark:text-dark-text-primary"
                            }`}
                          >
                            {app}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="mt-4">
                  <PrimaryButton
                    disabled={selectedApps.length === 0}
                    onPress={() => {
                      mediumImpact();
                      const defaultLimits = selectedApps.map((app) => ({
                        appId: app,
                        dailyLimit: 5,
                        enabled: true,
                      }));
                      setLimits(defaultLimits);
                      setStep(1);
                    }}
                  >
                    Next
                  </PrimaryButton>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 1: Set daily limits
  if (step === 1) {
    return (
      <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
        <ScrollView
          contentContainerStyle={{ gap: 20, padding: 24 }}
        >
          <Animated.View entering={enterAnim} exiting={exitAnim} key="step-1">
            <Text className="text-center text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              Set your daily limits
            </Text>
            <Text className="mt-2 text-center text-sm text-focuslab-secondary dark:text-dark-text-secondary">
              These are suggestions — change them anytime.
            </Text>

            <View className="mt-6 gap-3">
              {limits.map((limit) => (
                <OpenLimitRow
                  key={limit.appId}
                  limit={limit}
                  onUpdate={(dailyLimit) => {
                    setLimits((prev) =>
                      prev.map((l) =>
                        l.appId === limit.appId ? { ...l, dailyLimit } : l,
                      ),
                    );
                  }}
                />
              ))}
            </View>

            <View className="mt-8">
              <PrimaryButton
                onPress={() => {
                  mediumImpact();
                  setStep(2);
                }}
              >
                Next
              </PrimaryButton>
              <AnimatedPressable onPress={() => setStep(0)}>
                <View className="mt-3 items-center py-2">
                  <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                    Back
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Done!
  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ gap: 20, padding: 24 }}
      >
        <Animated.View entering={enterAnim} exiting={exitAnim} key="step-2">
          <View className="items-center pt-8">
            <Text className="text-5xl">🧘</Text>
          </View>

          <Text className="mt-6 text-center text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            You&apos;re set!
          </Text>
          <Text className="mt-3 text-center text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
            {limits.length} apps shielded.{" "}
            {limits[0]?.dailyLimit ?? 5} opens/day each.
          </Text>
          <Text className="mt-2 text-center text-sm text-focuslab-secondary dark:text-dark-text-secondary">
            You can adjust everything in Toolkit → App Disrupt.
          </Text>

          <View className="mt-8">
            <PrimaryButton
              onPress={async () => {
                successNotification();
                const doomScroll = DEFAULT_GATEWAY_CONFIG.doomScroll;
                updateConfig({
                  enabled: true,
                  openLimits: limits,
                  escalation: DEFAULT_GATEWAY_CONFIG.escalation,
                  doomScroll,
                });
                await applyShields();
                if (doomScroll.enabled) {
                  await startDoomScrollMonitor(
                    doomScroll.firstThresholdMinutes,
                    doomScroll.secondThresholdMinutes,
                  );
                }
                onComplete();
              }}
            >
              Done
            </PrimaryButton>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
