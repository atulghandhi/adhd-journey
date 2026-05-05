import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Switch } from "react-native";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react-native";
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
  getShieldedAppCount,
  getShieldedAppTokens,
  removeShieldedAppAt,
  debugFamilyControlsState,
  ShieldedAppView,
} from "../../../modules/family-controls-bridge";

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
  const [shieldedCount, setShieldedCount] = useState(0);
  const [shieldedTokens, setShieldedTokens] = useState<string[]>([]);

  const refreshShieldedCount = async () => {
    if (!isFamilyControlsAvailable()) return;
    const count = await getShieldedAppCount();
    const tokens = await getShieldedAppTokens();
    setShieldedCount(count);
    setShieldedTokens(tokens);
  };

  // Sync persisted auth state + shielded count with live native state on mount.
  // Also re-apply shields so the selection persists across app restarts.
  useEffect(() => {
    if (!isFamilyControlsAvailable()) return;
    void debugFamilyControlsState().then((s) => console.log("[Gateway] mount:", s));
    void getFamilyControlsStatus().then((status) => {
      setFamilyControlsAuthorized(status === "authorized");
      if (status === "authorized") {
        void applyShields().then(() => {
          void debugFamilyControlsState().then((s) => console.log("[Gateway] post-shield:", s));
        });
      }
    });
    void refreshShieldedCount();
  }, [setFamilyControlsAuthorized]);

  const handleRemoveShieldedApp = (index: number) => {
    Alert.alert(
      "Remove this app?",
      "It will no longer be shielded by the Mindful Gateway.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Remove",
          onPress: () => {
            void removeShieldedAppAt(index).then(() => {
              void refreshShieldedCount();
            });
          },
        },
      ],
    );
  };

  // First-run flow removed — the redesigned settings screen handles
  // "Select Shielded Apps" + customization in one place. Mark first-run as
  // complete on mount so nothing else short-circuits to the old flow.
  useEffect(() => {
    if (!completedFirstRun && firstRun === "true") {
      markFirstRunComplete();
    }
  }, [completedFirstRun, firstRun, markFirstRunComplete]);

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
      if (granted) {
        setFamilyControlsAuthorized(true);
      } else {
        // Double-check: the native side already retries after a transient
        // throw, but verify one more time before giving up.
        const status = await getFamilyControlsStatus();
        if (status === "authorized") {
          setFamilyControlsAuthorized(true);
        } else {
          Alert.alert(
            "Permission needed",
            "Next Thing needs Family Controls access to shield apps. Please try again — if the prompt doesn't appear, check Settings → Screen Time.",
            [{ text: "OK" }],
          );
          return;
        }
      }
    }

    try {
      const tokenCount = await presentAppPicker();
      if (tokenCount > 0) {
        const existing = config.openLimits.find((l) => l.appId === "shielded_apps");
        updateConfig({
          enabled: true,
          openLimits: [
            {
              appId: "shielded_apps",
              dailyLimit: existing?.dailyLimit ?? tokenCount * 5,
              enabled: true,
            },
          ],
        });
        await applyShields();
        await refreshShieldedCount();
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

        {shieldedCount > 0 ? (
          <View className="mt-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              {shieldedCount} app{shieldedCount === 1 ? "" : "s"} shielded
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {shieldedTokens.map((token, index) => (
                <View
                  key={token}
                  className="flex-row items-center gap-2 rounded-full bg-focuslab-primary/15 py-1.5 pl-3 pr-1.5 dark:bg-dark-surface"
                >
                  <ShieldedAppView
                    style={{ height: 24, width: 120 }}
                    token={token}
                  />
                  <Pressable
                    onPress={() => handleRemoveShieldedApp(index)}
                    hitSlop={8}
                    className="h-6 w-6 items-center justify-center rounded-full bg-focuslab-primary/25 dark:bg-dark-bg"
                  >
                    <X
                      color={dark ? "#C9E4D6" : "#52796F"}
                      size={14}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
            <Text className="mt-2 text-xs text-focuslab-secondary dark:text-dark-text-secondary">
              Tap “Select Shielded Apps” above to add more or change your
              selection.
            </Text>
          </View>
        ) : null}

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
