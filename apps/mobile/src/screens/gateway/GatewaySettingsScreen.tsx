import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Switch } from "react-native";
import { ChevronLeft, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import type { OpenLimitConfig, TimeWindow } from "@focuslab/shared";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { useGatewayStore } from "../../stores/gatewayStore";
import {
  isFamilyControlsAvailable,
  presentAppPicker,
  requestFamilyControlsAuth,
  applyShields,
  removeShields,
  startDoomScrollMonitor,
  stopDoomScrollMonitor,
} from "../../../modules/family-controls-bridge";
import { GatewayFirstRunFlow } from "./GatewayFirstRunFlow";
import { OpenLimitRow } from "./OpenLimitRow";
import { FreeWindowRow } from "./FreeWindowRow";

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

  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const handleToggleEnabled = async (value: boolean) => {
    selectionChanged();

    if (value && isFamilyControlsAvailable() && !familyControlsAuthorized) {
      const granted = await requestFamilyControlsAuth();
      setFamilyControlsAuthorized(granted);
      if (!granted) return;
    }

    updateConfig({ enabled: value });

    if (value) {
      await applyShields();
      if (config.doomScroll.enabled) {
        await startDoomScrollMonitor(
          config.doomScroll.firstThresholdMinutes,
          config.doomScroll.secondThresholdMinutes,
        );
      }
    } else {
      await removeShields();
      await stopDoomScrollMonitor();
    }
  };

  const handleChooseApps = async () => {
    lightImpact();
    const picked = await presentAppPicker();
    if (picked) {
      await applyShields();
    }
  };

  const handleUpdateLimit = (appId: string, dailyLimit: number) => {
    selectionChanged();
    const existing = config.openLimits.find((l) => l.appId === appId);
    if (existing) {
      updateConfig({
        openLimits: config.openLimits.map((l) =>
          l.appId === appId ? { ...l, dailyLimit } : l,
        ),
      });
    } else {
      updateConfig({
        openLimits: [
          ...config.openLimits,
          { appId, dailyLimit, enabled: true },
        ],
      });
    }
  };

  const handleAddFreeWindow = () => {
    lightImpact();
    updateConfig({
      freeWindows: [...config.freeWindows, { start: "17:00", end: "20:00" }],
    });
  };

  const handleUpdateFreeWindow = (index: number, window: TimeWindow) => {
    const updated = [...config.freeWindows];
    updated[index] = window;
    updateConfig({ freeWindows: updated });
  };

  const handleRemoveFreeWindow = (index: number) => {
    lightImpact();
    const updated = config.freeWindows.filter((_, i) => i !== index);
    updateConfig({ freeWindows: updated });
  };

  const todayOpenCounts = useGatewayStore((s) => {
    const counts: Record<string, number> = {};
    for (const limit of config.openLimits) {
      counts[limit.appId] = s.getOpenCount(limit.appId);
    }
    return counts;
  });

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{ gap: 16, padding: 24, paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <AnimatedPressable onPress={() => router.back()}>
            <ChevronLeft color={dark ? "#C9E4D6" : "#52796F"} size={24} />
          </AnimatedPressable>
          <View className="flex-1">
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              App Disrupt
            </Text>
            <Text className="mt-1 text-base text-focuslab-secondary dark:text-dark-text-secondary">
              Control how distracting apps behave
            </Text>
          </View>
        </View>

        {/* Enable toggle */}
        <AppCard>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Enable App Disrupt
              </Text>
              <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                Adds a breathing pause before you open selected apps.
              </Text>
            </View>
            <Switch
              onValueChange={handleToggleEnabled}
              trackColor={{ false: "#ccc", true: "#40916C" }}
              value={config.enabled}
            />
          </View>
        </AppCard>

        {/* Shielded apps */}
        {config.enabled ? (
          <>
            <AppCard>
              <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                Shielded apps
              </Text>
              {isFamilyControlsAvailable() ? (
                <Pressable
                  className="mt-4 rounded-xl bg-focuslab-primary/10 px-4 py-3 dark:bg-focuslab-primary/20"
                  onPress={handleChooseApps}
                >
                  <Text className="text-center text-sm font-semibold text-focuslab-primary">
                    Choose apps…
                  </Text>
                </Pressable>
              ) : (
                <Text className="mt-3 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                  FamilyControls requires iOS 16+. Use the Shortcuts setup
                  instead.
                </Text>
              )}
            </AppCard>

            {/* Open limits */}
            {config.openLimits.length > 0 ? (
              <AppCard>
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  Open limits
                </Text>
                <View className="mt-3 gap-3">
                  {config.openLimits.map((limit) => (
                    <OpenLimitRow
                      key={limit.appId}
                      limit={limit}
                      onUpdate={(dailyLimit) =>
                        handleUpdateLimit(limit.appId, dailyLimit)
                      }
                    />
                  ))}
                </View>
                <Text className="mt-3 text-xs text-focuslab-secondary dark:text-dark-text-secondary">
                  After reaching your limit, pauses get longer each time.
                </Text>
              </AppCard>
            ) : null}

            {/* Free windows */}
            <AppCard>
              <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                Free windows
              </Text>
              <Text className="mt-2 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                Apps open without a pause during these times.
              </Text>
              <View className="mt-3 gap-3">
                {config.freeWindows.map((w, i) => (
                  <FreeWindowRow
                    key={i}
                    onRemove={() => handleRemoveFreeWindow(i)}
                    onUpdate={(window) => handleUpdateFreeWindow(i, window)}
                    window={w}
                  />
                ))}
              </View>
              <Pressable
                className="mt-3 rounded-xl bg-focuslab-primary/10 px-4 py-2.5 dark:bg-focuslab-primary/20"
                onPress={handleAddFreeWindow}
              >
                <Text className="text-center text-sm font-semibold text-focuslab-primary">
                  + Add window
                </Text>
              </Pressable>
            </AppCard>

            {/* Advanced section */}
            <Pressable
              className="flex-row items-center justify-between"
              onPress={() => setAdvancedOpen(!advancedOpen)}
            >
              <Text className="text-sm font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
                Advanced
              </Text>
              {advancedOpen ? (
                <ChevronUp color={dark ? "#C9E4D6" : "#52796F"} size={18} />
              ) : (
                <ChevronDown color={dark ? "#C9E4D6" : "#52796F"} size={18} />
              )}
            </Pressable>

            {advancedOpen ? (
              <AppCard>
                {/* Breathing duration */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-focuslab-primaryDark dark:text-dark-text-primary">
                    Breathing pause
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => {
                        selectionChanged();
                        updateConfig({
                          breathDurationSeconds: Math.max(
                            3,
                            config.breathDurationSeconds - 1,
                          ),
                        });
                      }}
                    >
                      <Minus color={dark ? "#C9E4D6" : "#52796F"} size={18} />
                    </Pressable>
                    <Text className="w-10 text-center text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                      {config.breathDurationSeconds}s
                    </Text>
                    <Pressable
                      onPress={() => {
                        selectionChanged();
                        updateConfig({
                          breathDurationSeconds: Math.min(
                            30,
                            config.breathDurationSeconds + 1,
                          ),
                        });
                      }}
                    >
                      <Plus color={dark ? "#C9E4D6" : "#52796F"} size={18} />
                    </Pressable>
                  </View>
                </View>

                {/* Escalation */}
                <View className="mt-4">
                  <Text className="text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                    Escalation (after limit)
                  </Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-sm text-focuslab-primaryDark dark:text-dark-text-primary">
                      Extra per open
                    </Text>
                    <Text className="text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                      +{config.escalation.incrementPerOpenSeconds}s
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-sm text-focuslab-primaryDark dark:text-dark-text-primary">
                      Maximum
                    </Text>
                    <Text className="text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                      {config.escalation.capSeconds}s
                    </Text>
                  </View>
                </View>

                {/* Doom scroll brake */}
                <View className="mt-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                      Doom scroll brake
                    </Text>
                    <Switch
                      onValueChange={(val) => {
                        selectionChanged();
                        updateConfig({
                          doomScroll: { ...config.doomScroll, enabled: val },
                        });
                      }}
                      trackColor={{ false: "#ccc", true: "#40916C" }}
                      value={config.doomScroll.enabled}
                    />
                  </View>
                  {config.doomScroll.enabled ? (
                    <View className="mt-3 gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-focuslab-primaryDark dark:text-dark-text-primary">
                          First check-in
                        </Text>
                        <Text className="text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                          {config.doomScroll.firstThresholdMinutes} min
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-focuslab-primaryDark dark:text-dark-text-primary">
                          Second check-in
                        </Text>
                        <Text className="text-sm font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                          {config.doomScroll.secondThresholdMinutes} min
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </AppCard>
            ) : null}

            {/* Today's stats */}
            {Object.keys(todayOpenCounts).length > 0 ? (
              <AppCard>
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  Today&apos;s stats
                </Text>
                <View className="mt-3 gap-2">
                  {config.openLimits.map((limit) => {
                    const count = todayOpenCounts[limit.appId] ?? 0;
                    const pct = Math.min(
                      (count / Math.max(limit.dailyLimit, 1)) * 100,
                      100,
                    );
                    return (
                      <View key={limit.appId}>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm capitalize text-focuslab-primaryDark dark:text-dark-text-primary">
                            {limit.appId}
                          </Text>
                          <Text className="text-xs font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
                            {count}/{limit.dailyLimit}
                          </Text>
                        </View>
                        <View className="mt-1 h-2 overflow-hidden rounded-full bg-focuslab-border dark:bg-dark-border">
                          <View
                            className="h-full rounded-full bg-focuslab-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AppCard>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
