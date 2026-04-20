import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Switch } from "react-native";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { AppCard } from "../../components/ui/AppCard";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { useGatewayStore } from "../../stores/gatewayStore";
import {
  isFamilyControlsAvailable,
  getFamilyControlsStatus,
  presentAppPicker,
  requestFamilyControlsAuth,
  applyShields,
  startDoomScrollMonitor,
  stopDoomScrollMonitor,
} from "../../../modules/family-controls-bridge";
import { GatewayFirstRunFlow } from "./GatewayFirstRunFlow";

const PAUSE_OPTIONS = [3, 4, 5] as const;

export function GatewaySettingsScreen() {
  const router = useRouter();
  const { firstRun } = useLocalSearchParams<{ firstRun?: string }>();
  const { colorScheme } = useColorScheme();
  const { lightImpact, selectionChanged } = useHaptics();
  const dark = colorScheme === "dark";

  const config = useGatewayStore((s) => s.config);
  const completedFirstRun = useGatewayStore((s) => s.completedFirstRun);
  const familyControlsAuthorized = useGatewayStore((s) => s.familyControlsAuthorized);
  const updateConfig = useGatewayStore((s) => s.updateConfig);
  const markFirstRunComplete = useGatewayStore((s) => s.markFirstRunComplete);
  const setFamilyControlsAuthorized = useGatewayStore(
    (s) => s.setFamilyControlsAuthorized,
  );

  const [customizationOpen, setCustomizationOpen] = useState(false);

  // Sync persisted auth state with live native status on mount
  useEffect(() => {
    if (!isFamilyControlsAvailable()) return;
    void getFamilyControlsStatus().then((status) => {
      setFamilyControlsAuthorized(status === "authorized");
    });
  }, [setFamilyControlsAuthorized]);

  // Show first-run flow if not yet completed and requested
  const showFirstRun = firstRun === "true" && !completedFirstRun;
  if (showFirstRun) {
    return (
      <GatewayFirstRunFlow
        onComplete={() => {
          markFirstRunComplete();
        }}
      />
    );
  }

  // ── Derived config values ────────────────────────────────────────────────
  const pauseSeconds = ([3, 4, 5].includes(config.breathDurationSeconds)
    ? config.breathDurationSeconds
    : 5) as 3 | 4 | 5;
  const progressiveFriction = config.escalation.incrementPerOpenSeconds > 0;
  const checkIn10 = config.doomScroll.enabled;
  const checkIn30 = config.doomScroll.secondThresholdMinutes > 0;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSelectApps = async () => {
    lightImpact();

    if (!isFamilyControlsAvailable()) {
      // Fallback: route to the Shortcuts setup guide
      router.push("/disrupt-setup" as never);
      return;
    }

    // Request auth if not yet granted
    if (!familyControlsAuthorized) {
      const granted = await requestFamilyControlsAuth();
      setFamilyControlsAuthorized(granted);
      if (!granted) {
        Alert.alert(
          "Screen Time permission needed",
          "Open Settings → Screen Time → enable Next Thing to let App Disrupt shield your apps.",
          [{ text: "OK" }],
        );
        return;
      }
    }

    try {
      const appCount = await presentAppPicker();
      if (appCount > 0) {
        const existing = config.openLimits.find((l) => l.appId === "shielded_apps");
        updateConfig({
          enabled: true,
          openLimits: [
            {
              appId: "shielded_apps",
              dailyLimit: existing?.dailyLimit ?? appCount * 5,
              enabled: true,
            },
          ],
        });
        await applyShields();
      }
    } catch {
      Alert.alert(
        "Couldn't open app selector",
        "The native app picker isn't available here. Use the Shortcuts setup instead.",
        [{ text: "OK" }],
      );
    }
  };

  const handlePauseDuration = (seconds: 3 | 4 | 5) => {
    selectionChanged();
    updateConfig({ breathDurationSeconds: seconds });
  };

  const handleProgressiveFriction = (value: boolean) => {
    selectionChanged();
    updateConfig({
      escalation: {
        ...config.escalation,
        incrementPerOpenSeconds: value ? 1 : 0,
      },
    });
  };

  const handleCheckIn10 = async (value: boolean) => {
    selectionChanged();
    updateConfig({
      doomScroll: { ...config.doomScroll, enabled: value },
    });
    if (value) {
      await startDoomScrollMonitor(
        config.doomScroll.firstThresholdMinutes || 10,
        config.doomScroll.secondThresholdMinutes || 30,
      );
    } else {
      await stopDoomScrollMonitor();
    }
  };

  const handleCheckIn30 = async (value: boolean) => {
    selectionChanged();
    const nextSeconds = value ? 30 : 0;
    updateConfig({
      doomScroll: { ...config.doomScroll, secondThresholdMinutes: nextSeconds },
    });
    if (config.doomScroll.enabled) {
      await startDoomScrollMonitor(
        config.doomScroll.firstThresholdMinutes || 10,
        nextSeconds || 30,
      );
    }
  };

  const iconColor = dark ? "#C9E4D6" : "#52796F";

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nav header */}
        <View className="mb-6 flex-row items-center gap-3">
          <AnimatedPressable onPress={() => router.back()}>
            <ChevronLeft color={iconColor} size={24} />
          </AnimatedPressable>
          <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Mindful Gateway
          </Text>
        </View>

        {/* Page title + description */}
        <Text className="text-[34px] font-bold leading-tight text-focuslab-primaryDark dark:text-dark-text-primary">
          Mindful Gateway
        </Text>
        <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
          Mindful gateway adds a short pause before you open selected apps —
          giving you a second to make sure the action is intentional and what
          you want.
        </Text>

        {/* Select Shielded Apps button */}
        <Pressable
          className="mt-8 flex-row items-center justify-between rounded-2xl bg-focuslab-primaryDark px-6 py-5 dark:bg-dark-surface"
          onPress={handleSelectApps}
        >
          <Text className="text-lg font-bold text-white">
            Select Shielded Apps
          </Text>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ChevronRight color="#FFFFFF" size={20} />
          </View>
        </Pressable>

        {/* Customization collapsible */}
        <Pressable
          className="mt-6 flex-row items-center justify-between py-2"
          onPress={() => {
            selectionChanged();
            setCustomizationOpen((prev) => !prev);
          }}
        >
          <View className="flex-row items-center gap-2">
            <SlidersHorizontal color={iconColor} size={16} />
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Customization
            </Text>
          </View>
          <ChevronLeft
            color={iconColor}
            size={18}
            style={{
              transform: [{ rotate: customizationOpen ? "-90deg" : "0deg" }],
            }}
          />
        </Pressable>

        {customizationOpen ? (
          <AppCard>
            {/* Pause Duration */}
            <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              Pause Duration
            </Text>
            <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
              Select the length of your gateway breath.
            </Text>
            <View className="mt-4 flex-row gap-2">
              {PAUSE_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  className={`flex-1 items-center rounded-xl py-3 ${
                    pauseSeconds === s
                      ? "bg-focuslab-primaryDark dark:bg-focuslab-primary"
                      : "bg-focuslab-background dark:bg-dark-bg"
                  }`}
                  onPress={() => handlePauseDuration(s)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      pauseSeconds === s
                        ? "text-white"
                        : "text-focuslab-secondary dark:text-dark-text-secondary"
                    }`}
                  >
                    {s}s
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Divider */}
            <View className="my-4 h-px bg-focuslab-border/50 dark:bg-dark-border/50" />

            {/* Progressive Friction */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                  Progressive Friction
                </Text>
                <Text className="mt-1 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                  Add 1 second to the gateway pause every time a selected app
                  is opened during the day.
                </Text>
              </View>
              <Switch
                onValueChange={handleProgressiveFriction}
                trackColor={{ false: "#ccc", true: "#1B4332" }}
                value={progressiveFriction}
              />
            </View>

            {/* Divider */}
            <View className="my-4 h-px bg-focuslab-border/50 dark:bg-dark-border/50" />

            {/* Usage Interventions */}
            <Text className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Usage Interventions
            </Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between rounded-xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
                <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                  10-minute Check-in
                </Text>
                <Switch
                  onValueChange={(v) => { void handleCheckIn10(v); }}
                  trackColor={{ false: "#ccc", true: "#1B4332" }}
                  value={checkIn10}
                />
              </View>
              <View className="flex-row items-center justify-between rounded-xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
                <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                  30-minute Check-in
                </Text>
                <Switch
                  onValueChange={(v) => { void handleCheckIn30(v); }}
                  trackColor={{ false: "#ccc", true: "#1B4332" }}
                  value={checkIn30}
                />
              </View>
            </View>
          </AppCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
