import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { SPRING_BOUNCE, SPRING_MAGNETIC } from "../../animations/springs";
import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { NextThingLogo } from "../../components/NextThingLogo";
import { SafeAreaView, Text, View } from "../../components/primitives";
import { useHaptics } from "../../hooks/useHaptics";
import { useJourneyState } from "../../hooks/useJourneyState";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const PAUSE_SECONDS = 5;

const INHALE_MS = 4000;
const HOLD_MS = 2000;
const EXHALE_MS = 4000;

function getPhaseLabel(elapsed: number): string {
  const cycleMs = INHALE_MS + HOLD_MS + EXHALE_MS;
  const phase = elapsed % cycleMs;

  if (phase < INHALE_MS) {
    return "Breathe in";
  }

  if (phase < INHALE_MS + HOLD_MS) {
    return "Hold";
  }

  return "Breathe out";
}

export function DisruptScreen() {
  const router = useRouter();
  const { app } = useLocalSearchParams<{ app?: string }>();
  const { data: state } = useJourneyState();
  const { lightImpact, mediumImpact } = useHaptics();
  const { reducedMotion } = useReducedMotion();

  const [countdown, setCountdown] = useState(PAUSE_SECONDS);
  const [phaseLabel, setPhaseLabel] = useState("Breathe in");
  const [paused, setPaused] = useState(false);
  const startTime = useRef(Date.now());

  const breathScale = useSharedValue(1);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    mediumImpact();
    logoScale.value = withSpring(1, SPRING_BOUNCE);
    logoOpacity.value = withTiming(1, { duration: 400 });
  }, [logoScale, logoOpacity, mediumImpact]);

  // Breathing circle animation
  useEffect(() => {
    if (paused || reducedMotion) {
      cancelAnimation(breathScale);
      breathScale.value = withTiming(1, { duration: 200 });
      return;
    }

    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: INHALE_MS }),
        withTiming(1.18, { duration: HOLD_MS }),
        withTiming(1, { duration: EXHALE_MS }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(breathScale);
    };
  }, [breathScale, paused, reducedMotion]);

  // Countdown and phase label
  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, PAUSE_SECONDS - Math.floor(elapsed / 1000));

      setCountdown(remaining);
      setPhaseLabel(getPhaseLabel(elapsed));

      if (remaining <= 3 && remaining > 0 && remaining !== countdown) {
        lightImpact();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [paused, countdown, lightImpact]);

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
    : "that app";
  const canContinue = countdown === 0;

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
              {phaseLabel}
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
              ? "Take a moment. What do you actually need right now?"
              : "Pause for a moment..."}
          </Text>
          {!canContinue ? (
            <Text className="mt-2 text-center text-base text-focuslab-secondary dark:text-dark-text-secondary">
              Before you open {appLabel}, take a breath.
            </Text>
          ) : null}
        </View>

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

        {/* Action buttons */}
        {canContinue ? (
          <View className="mt-8 w-full gap-3">
            <AnimatedPressable
              onPress={() => {
                mediumImpact();
                router.replace("/(tabs)/journey" as never);
              }}
            >
              <View className="items-center rounded-[14px] bg-focuslab-primary py-3.5">
                <Text className="text-base font-bold text-white">
                  Open Next Thing
                </Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => {
                lightImpact();
                router.back();
              }}
            >
              <View className="items-center rounded-[14px] py-3">
                <Text className="text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
                  Continue to {appLabel}
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
