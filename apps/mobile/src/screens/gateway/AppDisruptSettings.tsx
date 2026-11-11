import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, Switch } from "react-native";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import type { GatewayPauseStyle } from "@focuslab/shared";

import { AppCard } from "../../components/ui/AppCard";
import { Pressable, Text, View } from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { syncGatewayFromStore } from "../../lib/gateway";
import { SHIELDED_APPS_ID, useGatewayStore } from "../../stores/gatewayStore";
import {
  ShieldedAppView,
  getFamilyControlsStatus,
  getShieldedAppTokens,
  isFamilyControlsAvailable,
  presentAppPicker,
  removeShieldedAppAt,
  requestFamilyControlsAuth,
} from "../../../modules/family-controls-bridge";

const PAUSE_OPTIONS = [3, 5, 10, 15];
const SESSION_OPTIONS = [1, 5, 15];
const STYLE_OPTIONS: { label: string; value: GatewayPauseStyle }[] = [
  { label: "Guided breathing", value: "guided" },
  { label: "Quick pause", value: "quick" },
];

const SWITCH_TRACK = { false: "#ccc", true: "#1B4332" };

function closest(options: number[], value: number): number {
  return options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best,
  );
}

interface OptionRowProps<T> {
  format: (value: T) => string;
  onSelect: (value: T) => void;
  options: T[];
  selected: T;
}

function OptionRow<T extends number | string>({
  format,
  onSelect,
  options,
  selected,
}: OptionRowProps<T>) {
  return (
    <View className="mt-4 flex-row gap-2">
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-xl px-1 py-3 ${
              active
                ? "bg-focuslab-primaryDark dark:bg-focuslab-primary"
                : "bg-focuslab-background dark:bg-dark-bg"
            }`}
            key={String(option)}
            onPress={() => onSelect(option)}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                active
                  ? "text-white"
                  : "text-focuslab-secondary dark:text-dark-text-secondary"
              }`}
            >
              {format(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Divider() {
  return <View className="my-4 h-px bg-focuslab-border/50 dark:bg-dark-border/50" />;
}

/**
 * Everything needed to set up and tune App Disrupt: choose apps, switch it
 * on or off, and adjust the pause. Shared by the settings route and the
 * journey's Day 17 screen so the two cannot drift apart.
 *
 * Settings are only written to the store here. `useShieldDeepLink` watches
 * the store and pushes every change to the native Screen Time layer.
 */
export function AppDisruptSettings() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { lightImpact, selectionChanged } = useHaptics();
  const dark = colorScheme === "dark";
  const iconColor = dark ? "#C9E4D6" : "#52796F";
  const shieldsAvailable = isFamilyControlsAvailable();

  const config = useGatewayStore((s) => s.config);
  const familyControlsAuthorized = useGatewayStore((s) => s.familyControlsAuthorized);
  const nativeStatus = useGatewayStore((s) => s.nativeStatus);
  const opensToday = useGatewayStore((s) => s.getOpenCount(SHIELDED_APPS_ID));
  const setFamilyControlsAuthorized = useGatewayStore(
    (s) => s.setFamilyControlsAuthorized,
  );
  const updateConfig = useGatewayStore((s) => s.updateConfig);

  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [shieldedTokens, setShieldedTokens] = useState<string[]>([]);

  const refreshTokens = useCallback(async () => {
    if (!isFamilyControlsAvailable()) return [];
    const tokens = await getShieldedAppTokens();
    setShieldedTokens(tokens);
    return tokens;
  }, []);

  // Show the real device state, not what was true last time.
  useEffect(() => {
    void refreshTokens();
    void syncGatewayFromStore();
  }, [refreshTokens]);

  // ── Derived values ──────────────────────────────────────────────────────
  const pauseSeconds = closest(PAUSE_OPTIONS, config.breathDurationSeconds);
  const sessionMinutes = closest(SESSION_OPTIONS, config.sessionMinutes);
  const progressiveFriction = config.escalation.incrementPerOpenSeconds > 0;
  const checkIn10 = config.doomScroll.enabled;
  const checkIn30 = config.doomScroll.secondThresholdMinutes > 0;
  const hasApps = shieldedTokens.length > 0;
  // iOS 26.5+ lets the shield's button open Next Thing directly.
  const canOpenFromShield =
    nativeStatus?.canOpenFromShield ??
    (Platform.OS === "ios" && parseFloat(String(Platform.Version)) >= 26.5);
  const guided = config.pauseStyle === "guided";

  // ── Handlers ────────────────────────────────────────────────────────────
  const ensureAuthorized = async (): Promise<boolean> => {
    if (familyControlsAuthorized) return true;

    // Some iOS versions report failure even though the user approved, so
    // confirm against the live status before giving up.
    const granted =
      (await requestFamilyControlsAuth()) ||
      (await getFamilyControlsStatus()) === "authorized";
    setFamilyControlsAuthorized(granted);

    if (!granted) {
      Alert.alert(
        "Screen Time access needed",
        "Next Thing uses Screen Time to pause the apps you choose. Allow it when iOS asks, or switch it on in Settings.",
        [
          { style: "cancel", text: "Not now" },
          { onPress: () => void Linking.openSettings(), text: "Open Settings" },
        ],
      );
    }
    return granted;
  };

  const handleSelectApps = async () => {
    lightImpact();

    if (!shieldsAvailable) {
      // No Screen Time shields on this device: offer the Shortcuts guide.
      router.push("/disrupt-setup" as never);
      return;
    }

    if (!(await ensureAuthorized())) return;

    let selected: number;
    try {
      selected = await presentAppPicker();
    } catch {
      Alert.alert(
        "Couldn't open the app list",
        "Make sure Screen Time is switched on in Settings, then try again.",
        [{ text: "OK" }],
      );
      return;
    }
    if (selected < 0) return; // Backed out without changing anything.

    const hadApps = hasApps;
    await refreshTokens();

    // Choosing apps for the first time switches App Disrupt on. After that
    // the switch below is the user's to control.
    if (selected > 0 && !hadApps && !useGatewayStore.getState().config.enabled) {
      updateConfig({ enabled: true });
    }

    const status = await syncGatewayFromStore();

    // Before iOS 26.5 the guided pause is reached through a notification.
    if (
      selected > 0 &&
      status &&
      !status.canOpenFromShield &&
      useGatewayStore.getState().config.pauseStyle === "guided"
    ) {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        await Notifications.requestPermissionsAsync();
      }
    }
  };

  const handleRemoveShieldedApp = (index: number) => {
    Alert.alert("Stop pausing this app?", "It will open straight away again.", [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Remove",
        onPress: () => {
          void removeShieldedAppAt(index)
            .then(refreshTokens)
            .then(syncGatewayFromStore);
        },
      },
    ]);
  };

  const handleEnabled = (value: boolean) => {
    selectionChanged();
    updateConfig({ enabled: value });
  };

  const handlePauseDuration = (seconds: number) => {
    selectionChanged();
    updateConfig({ breathDurationSeconds: seconds });
  };

  const handleSessionMinutes = (minutes: number) => {
    selectionChanged();
    updateConfig({ sessionMinutes: minutes });
  };

  const handlePauseStyle = (style: GatewayPauseStyle) => {
    selectionChanged();
    updateConfig({ pauseStyle: style });
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

  const handleCheckIn10 = (value: boolean) => {
    selectionChanged();
    updateConfig({
      doomScroll: {
        ...config.doomScroll,
        enabled: value,
        firstThresholdMinutes: config.doomScroll.firstThresholdMinutes || 10,
      },
    });
  };

  const handleCheckIn30 = (value: boolean) => {
    selectionChanged();
    updateConfig({
      doomScroll: {
        ...config.doomScroll,
        secondThresholdMinutes: value ? 30 : 0,
      },
    });
  };

  // ── Copy that depends on the pause style and iOS version ────────────────
  let pauseStep: string;
  if (!shieldsAvailable) {
    pauseStep = `Next Thing opens with a ${pauseSeconds}-second breathing pause.`;
  } else if (!guided) {
    pauseStep = `Tap "Take a breath". A ${pauseSeconds}-second pause runs right there on the shield.`;
  } else if (canOpenFromShield) {
    pauseStep = `Tap "Take a breath". Next Thing opens with a ${pauseSeconds}-second breathing pause.`;
  } else {
    pauseStep = `Tap "Take a breath", then the notification, for a ${pauseSeconds}-second breathing pause.`;
  }

  let styleHint: string;
  if (!guided) {
    styleHint =
      "The pause stays on the shield, with no app switch. iOS shows shields as plain text, so there is no animation or live countdown.";
  } else if (canOpenFromShield) {
    styleHint =
      "The shield opens Next Thing for an animated breathing countdown, then sends you on to your app.";
  } else {
    styleHint =
      "The shield sends a notification that opens an animated breathing countdown. Needs notifications allowed. iOS 26.5 or later skips the notification.";
  }

  return (
    <>
      {/* Page title + description */}
      <Text className="text-[34px] font-bold leading-tight text-focuslab-primaryDark dark:text-dark-text-primary">
        App Disrupt
      </Text>
      <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
        A short breathing pause before the apps that pull you in, so opening
        them is a choice instead of a reflex.
      </Text>

      {/* Choose apps */}
      <Pressable
        accessibilityRole="button"
        className="mt-8 flex-row items-center justify-between rounded-2xl bg-focuslab-primaryDark px-6 py-5 dark:bg-dark-surface"
        onPress={() => {
          void handleSelectApps();
        }}
      >
        <Text className="text-lg font-bold text-white">
          {hasApps ? "Change apps" : "Choose apps to pause"}
        </Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <ChevronRight color="#FFFFFF" size={20} />
        </View>
      </Pressable>

      {hasApps ? (
        <View className="mt-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            {shieldedTokens.length} paused
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {shieldedTokens.map((token, index) => (
              <View
                className="flex-row items-center gap-2 rounded-full bg-focuslab-primary/15 py-1.5 pl-3 pr-1.5 dark:bg-dark-surface"
                key={token}
              >
                <ShieldedAppView style={{ height: 24, width: 120 }} token={token} />
                <Pressable
                  accessibilityLabel="Remove"
                  accessibilityRole="button"
                  className="h-6 w-6 items-center justify-center rounded-full bg-focuslab-primary/25 dark:bg-dark-bg"
                  hitSlop={8}
                  onPress={() => handleRemoveShieldedApp(index)}
                >
                  <X color={iconColor} size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* On / off */}
      {hasApps ? (
        <View className="mt-6">
          <AppCard>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                  Pause my apps
                </Text>
                <Text className="mt-1 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                  {config.enabled
                    ? `On · ${opensToday} open${opensToday === 1 ? "" : "s"} today`
                    : "Off. Your apps open without a pause."}
                </Text>
              </View>
              <Switch
                onValueChange={handleEnabled}
                trackColor={SWITCH_TRACK}
                value={config.enabled}
              />
            </View>
          </AppCard>
        </View>
      ) : null}

      {/* How it works */}
      <View className="mt-6">
        <AppCard>
          <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            How it works
          </Text>
          {[
            shieldsAvailable
              ? "Open a paused app and a Next Thing shield appears instead."
              : "Open a paused app and your Shortcuts automation runs.",
            pauseStep,
            shieldsAvailable
              ? `Continue for ${sessionMinutes} minute${sessionMinutes === 1 ? "" : "s"}, or walk away. Then the pause comes back.`
              : "Continue to the app, or walk away.",
          ].map((step, index) => (
            <View className="mt-3 flex-row gap-3" key={step}>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-focuslab-primary/15">
                <Text className="text-xs font-bold text-focuslab-primary">
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 text-sm leading-5 text-focuslab-primaryDark dark:text-dark-text-primary">
                {step}
              </Text>
            </View>
          ))}
        </AppCard>
      </View>

      {/* Customization collapsible */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: customizationOpen }}
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
          {/* Pause duration */}
          <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Pause length
          </Text>
          <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
            How long you breathe before you can continue.
          </Text>
          <OptionRow
            format={(seconds) => `${seconds}s`}
            onSelect={handlePauseDuration}
            options={PAUSE_OPTIONS}
            selected={pauseSeconds}
          />

          <Divider />

          {/* Progressive friction */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Progressive friction
              </Text>
              <Text className="mt-1 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                Add 1 second to the pause for every open that day, up to{" "}
                {Math.max(config.escalation.capSeconds, pauseSeconds)} seconds.
              </Text>
            </View>
            <Switch
              onValueChange={handleProgressiveFriction}
              trackColor={SWITCH_TRACK}
              value={progressiveFriction}
            />
          </View>

          {shieldsAvailable ? (
            <>
              <Divider />

              {/* Session length */}
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Time per open
              </Text>
              <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                How long an app stays open before the pause comes back.
              </Text>
              <OptionRow
                format={(minutes) => `${minutes} min`}
                onSelect={handleSessionMinutes}
                options={SESSION_OPTIONS}
                selected={sessionMinutes}
              />

              <Divider />

              {/* Pause style */}
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Pause style
              </Text>
              <OptionRow
                format={(style) =>
                  STYLE_OPTIONS.find((option) => option.value === style)?.label ?? style
                }
                onSelect={handlePauseStyle}
                options={STYLE_OPTIONS.map((option) => option.value)}
                selected={config.pauseStyle}
              />
              <Text className="mt-3 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                {styleHint}
              </Text>

              <Divider />

              {/* Usage check-ins */}
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                Usage check-ins
              </Text>
              <Text className="mb-3 mt-1 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
                Bring the pause back early once you have spent this long in
                your paused apps today.
              </Text>

              <View className="gap-3">
                <View className="flex-row items-center justify-between rounded-xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
                  <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                    After 10 minutes
                  </Text>
                  <Switch
                    onValueChange={handleCheckIn10}
                    trackColor={SWITCH_TRACK}
                    value={checkIn10}
                  />
                </View>
                <View className="flex-row items-center justify-between rounded-xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
                  <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
                    After 30 minutes
                  </Text>
                  <Switch
                    onValueChange={handleCheckIn30}
                    trackColor={SWITCH_TRACK}
                    value={checkIn30}
                  />
                </View>
              </View>
            </>
          ) : null}
        </AppCard>
      ) : null}
    </>
  );
}
