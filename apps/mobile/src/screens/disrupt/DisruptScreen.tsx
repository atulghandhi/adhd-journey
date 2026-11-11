import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  computeShieldPauseSeconds,
  formatHHMM,
  isInFreeWindow,
} from "@focuslab/shared";

import { SPRING_BOUNCE } from "../../animations/springs";
import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { NextThingLogo } from "../../components/NextThingLogo";
import { SafeAreaView, Text, View } from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useToolkit } from "../../hooks/useToolkit";
import { openAppByScheme, urlSchemeForApp } from "../../lib/gateway";
import { SHIELDED_APPS_ID, useGatewayStore } from "../../stores/gatewayStore";
import {
  ShieldedAppView,
  isFamilyControlsAvailable,
  unlockForSession,
} from "../../../modules/family-controls-bridge";

// One breath is 40% in, 20% hold, 40% out. The cycle stretches to fit the
// pause (so a 5-second pause is one full breath) within sensible limits.
const MIN_CYCLE_MS = 4000;
const MAX_CYCLE_MS = 10000;

function breathCycleMs(pauseSeconds: number): number {
  return Math.min(Math.max(pauseSeconds * 1000, MIN_CYCLE_MS), MAX_CYCLE_MS);
}

function getPhaseLabel(elapsedMs: number, cycleMs: number): string {
  const position = (elapsedMs % cycleMs) / cycleMs;

  if (position < 0.4) {
    return "Breathe in";
  }

  if (position < 0.6) {
    return "Hold";
  }

  return "Breathe out";
}

function minutesLabel(minutes: number): string {
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

// With the Shortcuts automation, sending the user on to the app fires the
// "app opened" automation again and lands them straight back here. Remember
// the last app we let through so that bounce can be waved on instead of
// starting a second pause.
const BOUNCE_WINDOW_MS = 15_000;
let lastContinued: { app: string; at: number } | null = null;

/**
 * The breathing pause shown before a distracting app opens.
 *
 * It is reached three ways:
 *  - from a Screen Time shield ("Take a breath"), with the request the
 *    ShieldAction extension left for us in the gateway store;
 *  - from a Shortcuts automation, as `nextthing://disrupt?app=<name>`;
 *  - directly, with neither.
 */
export function DisruptScreen() {
  const { app, r } = useLocalSearchParams<{ app?: string; r?: string }>();

  // A new hand-off (or a different app) gets a fresh pause, even when this
  // screen is already showing.
  return <DisruptSession app={app} key={`${app ?? "shield"}:${r ?? "0"}`} />;
}

function DisruptSession({ app }: { app?: string }) {
  const router = useRouter();
  const { data: state } = useJourneyState();
  const { lightImpact, mediumImpact, successNotification } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const { keepItems } = useToolkit();

  const config = useGatewayStore((s) => s.config);
  const applyNativeStatus = useGatewayStore((s) => s.applyNativeStatus);
  const incrementOpen = useGatewayStore((s) => s.incrementOpen);
  const getOpenCount = useGatewayStore((s) => s.getOpenCount);
  const resetIfNewDay = useGatewayStore((s) => s.resetIfNewDay);
  const setShieldRequest = useGatewayStore((s) => s.setShieldRequest);
  const strategySnapshot = useGatewayStore((s) => s.strategySnapshot);
  const updateStrategySnapshot = useGatewayStore((s) => s.updateStrategySnapshot);

  // The shield hand-off this pause is for, fixed for the life of the screen.
  const [request] = useState(() =>
    app ? null : useGatewayStore.getState().shieldRequest,
  );

  // The Shortcuts automation re-fired because we just sent the user on.
  const [isBounce] = useState(
    () =>
      lastContinued !== null &&
      lastContinued.app === app &&
      Date.now() - lastContinued.at < BOUNCE_WINDOW_MS,
  );

  const appId = app ?? SHIELDED_APPS_ID;

  // Decide the pause once. Recomputing on re-render would move the countdown
  // target mid-breath as open counts update.
  const [pauseSeconds] = useState(() => {
    if (isBounce) return 0;
    if (isInFreeWindow(config.freeWindows, formatHHMM(new Date()))) return 0;
    if (request) return Math.max(0, Math.round(request.pauseSeconds));
    return computeShieldPauseSeconds(config, getOpenCount(appId));
  });

  const [countdown, setCountdown] = useState(pauseSeconds);
  const [phaseLabel, setPhaseLabel] = useState("Breathe in");
  const [working, setWorking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const startTime = useRef(Date.now());
  const cycleMs = breathCycleMs(pauseSeconds);

  const breathScale = useSharedValue(1);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/journey" as never);
    }
  }, [router]);

  // Shortcuts path: count this open in JS. Shield opens are counted natively
  // when the pause ends in "continue".
  useEffect(() => {
    resetIfNewDay();
    if (app && !isBounce) incrementOpen(app);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wave a Shortcuts bounce straight back to the app.
  useEffect(() => {
    if (!isBounce || !app) return;
    const scheme = urlSchemeForApp({ appName: app });
    void (scheme ? openAppByScheme(scheme) : Promise.resolve(false)).then(leave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick a toolkit strategy to show once the pause is over. keepItems and
  // state?.tasks arrive asynchronously, so watch them but write only once.
  const snapshotWritten = useRef(false);
  useEffect(() => {
    if (snapshotWritten.current) return;
    if (!state?.tasks || keepItems.length === 0) return;
    const randomKeep = keepItems[Math.floor(Math.random() * keepItems.length)];
    const matchedTask = state.tasks.find((t) => t.task.id === randomKeep.task_id);
    if (matchedTask) {
      snapshotWritten.current = true;
      const body = matchedTask.task.task_body;
      updateStrategySnapshot({
        strategyText: body
          ? body.slice(0, 120) + (body.length > 120 ? "…" : "")
          : matchedTask.task.title,
        taskOrder: matchedTask.task.order,
        taskTitle: matchedTask.task.title,
      });
    }
  }, [state?.tasks, keepItems, updateStrategySnapshot]);

  // Entrance animation
  useEffect(() => {
    mediumImpact();
    logoScale.value = withSpring(1, SPRING_BOUNCE);
    logoOpacity.value = withTiming(1, { duration: 400 });
  }, [logoScale, logoOpacity, mediumImpact]);

  // Breathing circle, in time with the phase label.
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(breathScale);
      breathScale.value = withTiming(1, { duration: 200 });
      return;
    }

    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: cycleMs * 0.4 }),
        withTiming(1.18, { duration: cycleMs * 0.2 }),
        withTiming(1, { duration: cycleMs * 0.4 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(breathScale);
    };
  }, [breathScale, cycleMs, reducedMotion]);

  // Countdown and phase label on one stable interval.
  const lastHapticSecond = useRef(-1);
  useEffect(() => {
    if (pauseSeconds <= 0) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, pauseSeconds - Math.floor(elapsed / 1000));

      setCountdown(remaining);
      setPhaseLabel(getPhaseLabel(elapsed, cycleMs));

      if (remaining <= 3 && remaining > 0 && remaining !== lastHapticSecond.current) {
        lastHapticSecond.current = remaining;
        lightImpact();
      }

      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [cycleMs, pauseSeconds, lightImpact]);

  // Once the app is unlocked and the user has switched to it, put this
  // screen away so Next Thing is back to normal when they return.
  useEffect(() => {
    if (!unlocked) return;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background") leave();
    });
    return () => subscription.remove();
  }, [leave, unlocked]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const currentTask = state?.currentTask;
  const appLabel = app
    ? app.charAt(0).toUpperCase() + app.slice(1)
    : request?.appName ?? "your app";
  const canContinue = countdown === 0;
  const openCount = app ? getOpenCount(app) : request?.opensToday ?? 0;
  const sessionLabel = minutesLabel(Math.max(1, config.sessionMinutes));

  const handleStay = () => {
    mediumImpact();
    setShieldRequest(null);
    router.replace("/(tabs)/journey" as never);
  };

  const handleContinue = async () => {
    if (working) return;
    setWorking(true);
    lightImpact();

    try {
      let liftedShield = false;

      if (isFamilyControlsAvailable()) {
        // Lift the shield only for the app being opened when we know which
        // one it is; otherwise (Shortcuts path) lift them all so the user is
        // not paused twice for one open.
        const scope = request && request.kind !== "all" ? "target" : "all";
        const status = await unlockForSession(scope);
        if (status) {
          applyNativeStatus(status);
          liftedShield = status.unlockUntil > 0;
        }
      }
      setShieldRequest(null);

      const scheme = urlSchemeForApp({
        appName: app ?? request?.appName,
        bundleId: request?.bundleId,
      });
      if (app) lastContinued = { app, at: Date.now() };

      if (scheme && (await openAppByScheme(scheme))) {
        leave();
        return;
      }

      if (liftedShield) {
        // iOS cannot switch to an arbitrary app for us. The shield is down,
        // so the user is one swipe away.
        successNotification();
        setUnlocked(true);
        return;
      }

      leave();
    } finally {
      setWorking(false);
    }
  };

  if (isBounce) {
    return <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg" />;
  }

  if (unlocked) {
    return (
      <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
        <View className="flex-1 items-center justify-center px-8">
          <NextThingLogo size={56} />
          <Text className="mt-8 text-center text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            {appLabel === "your app" ? "Your app is" : `${appLabel} is`} open for{" "}
            {sessionLabel}
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
            Swipe right along the bottom edge of your screen to jump back to
            it. The pause returns when your time is up.
          </Text>
          <View className="mt-8 w-full">
            <AnimatedPressable onPress={leave}>
              <View className="items-center rounded-[14px] bg-focuslab-primary py-3.5">
                <Text className="text-base font-bold text-white">Done</Text>
              </View>
            </AnimatedPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <Animated.View style={logoStyle}>
          <NextThingLogo size={56} />
        </Animated.View>

        {/* Breathing circle */}
        <Animated.View
          className="mt-8 h-52 w-52 items-center justify-center rounded-full bg-focuslab-primary/15 dark:bg-focuslab-primary/10"
          style={breathStyle}
        >
          <View className="h-36 w-36 items-center justify-center rounded-full bg-focuslab-primary/25 dark:bg-focuslab-primary/20">
            <Text className="text-center text-xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {canContinue ? "Nicely done" : phaseLabel}
            </Text>
            {!canContinue ? (
              <Text className="mt-1 text-3xl font-bold text-focuslab-primary">
                {countdown}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Prompt text */}
        <View className="mt-8 items-center">
          <Text className="text-center text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            {canContinue
              ? "What do you actually need right now?"
              : "Pause for a moment..."}
          </Text>
          {!canContinue ? (
            <Text className="mt-2 text-center text-base text-focuslab-secondary dark:text-dark-text-secondary">
              Before you open {appLabel}, take a breath.
            </Text>
          ) : null}
        </View>

        {/* The app being opened, drawn by iOS from its opaque token */}
        {request?.token && !request.appName ? (
          <View className="mt-4 rounded-full bg-focuslab-primary/15 px-3 py-1.5 dark:bg-dark-surface">
            <ShieldedAppView
              style={{ height: 24, width: 140 }}
              token={request.token}
            />
          </View>
        ) : null}

        {/* Today's task reminder */}
        {currentTask && canContinue ? (
          <View className="mt-6 w-full rounded-2xl bg-white px-5 py-4 dark:bg-dark-surface">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Today's task - Day {currentTask.task.order}
            </Text>
            <Text className="mt-1 text-base font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {currentTask.task.title}
            </Text>
          </View>
        ) : null}

        {/* Toolkit strategy reminder */}
        {strategySnapshot && canContinue ? (
          <View className="mt-4 w-full rounded-2xl border border-focuslab-border bg-white px-5 py-4 dark:border-dark-border dark:bg-dark-surface">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              🧰 From your toolkit — Day {strategySnapshot.taskOrder}
            </Text>
            <Text className="mt-1 text-base font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {strategySnapshot.taskTitle}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-focuslab-secondary dark:text-dark-text-secondary">
              {strategySnapshot.strategyText}
            </Text>
          </View>
        ) : null}

        {/* Open count */}
        {canContinue && openCount > 0 ? (
          <View className="mt-3">
            <Text className="text-center text-xs text-focuslab-secondary dark:text-dark-text-secondary">
              {app
                ? `You've opened ${appLabel} ${openCount} time${openCount !== 1 ? "s" : ""} today`
                : `You've opened your paused apps ${openCount} time${openCount !== 1 ? "s" : ""} today`}
            </Text>
          </View>
        ) : null}

        {/* Actions. Walking away is always available; continuing only once
            the pause is over. */}
        <View className="mt-8 w-full gap-3">
          <AnimatedPressable onPress={handleStay}>
            <View className="items-center rounded-[14px] bg-focuslab-primary py-3.5">
              <Text className="text-base font-bold text-white">
                I don't need it
              </Text>
            </View>
          </AnimatedPressable>

          {canContinue ? (
            <AnimatedPressable
              disabled={working}
              onPress={() => {
                void handleContinue();
              }}
            >
              <View className="items-center rounded-[14px] py-3">
                <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                  Continue to {appLabel}
                  {request ? ` for ${sessionLabel}` : ""}
                </Text>
              </View>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
