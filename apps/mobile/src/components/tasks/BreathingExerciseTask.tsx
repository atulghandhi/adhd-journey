import { PlayCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useHaptics } from "../../hooks/useHaptics";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Pressable, Text, View } from "../primitives";
import {
  formatSeconds,
  getBreathingPhaseLabel,
  getCompletedBreathingCycles,
  getSecondsRemaining,
  normalizeBreathingExerciseConfig,
} from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

export function BreathingExerciseTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const breathingConfig = normalizeBreathingExerciseConfig(config);
  const { lightImpact, successNotification } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const [secondsRemaining, setSecondsRemaining] = useState(
    breathingConfig.durationSeconds,
  );
  const [targetTimeMs, setTargetTimeMs] = useState<number | null>(null);
  const [phaseLabel, setPhaseLabel] = useState("Breathe in");
  const [completionData, setCompletionData] = useState<Record<string, unknown>>();
  const phaseRef = useRef<string | null>(null);
  const scale = useSharedValue(1);
  const elapsedSeconds = breathingConfig.durationSeconds - secondsRemaining;
  const cycleProgress = getCompletedBreathingCycles(
    elapsedSeconds,
    breathingConfig,
    breathingConfig.durationSeconds,
  );

  useEffect(() => {
    onCompletionChange(Boolean(completionData), completionData);
  }, [completionData, onCompletionChange]);

  useEffect(() => {
    if (!targetTimeMs || completionData) {
      return;
    }

    const updateCountdown = () => {
      const nextRemaining = getSecondsRemaining(targetTimeMs);
      const nextElapsed = Math.max(0, breathingConfig.durationSeconds - nextRemaining);
      const nextPhase = getBreathingPhaseLabel(nextElapsed, breathingConfig);

      setSecondsRemaining(nextRemaining);
      setPhaseLabel(nextPhase);

      if (phaseRef.current && phaseRef.current !== nextPhase) {
        lightImpact();
      }

      phaseRef.current = nextPhase;

      if (nextRemaining === 0) {
        successNotification();
        setCompletionData({
          completedAt: new Date().toISOString(),
          durationSeconds: breathingConfig.durationSeconds,
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 250);

    return () => {
      clearInterval(timer);
    };
  }, [
    breathingConfig,
    completionData,
    lightImpact,
    successNotification,
    targetTimeMs,
  ]);

  useEffect(() => {
    if (!targetTimeMs || completionData) {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 120 });
      return;
    }

    if (reducedMotion) {
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: breathingConfig.inhaleSeconds * 1000 }),
        withTiming(1.15, { duration: breathingConfig.holdSeconds * 1000 }),
        withTiming(1, { duration: breathingConfig.exhaleSeconds * 1000 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 120 });
    };
  }, [breathingConfig, completionData, reducedMotion, scale, targetTimeMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const beginExercise = () => {
    setCompletionData(undefined);
    setSecondsRemaining(breathingConfig.durationSeconds);
    setTargetTimeMs(Date.now() + breathingConfig.durationSeconds * 1000);
    setPhaseLabel("Breathe in");
    phaseRef.current = null;
  };

  return (
    <View className="items-center">
      <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
        {breathingConfig.label}
      </Text>

      <Animated.View
        className="mt-6 h-60 w-60 items-center justify-center rounded-full bg-focuslab-primary"
        style={animatedStyle}
      >
        <Text className="text-center text-2xl font-bold text-white">
          {phaseLabel}
        </Text>
        <Text className="mt-2 text-base font-medium text-white/90">
          {formatSeconds(secondsRemaining)}
        </Text>
      </Animated.View>

      <Text className="mt-4 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        {cycleProgress.completedCycles} of {cycleProgress.totalCycles} cycles complete
      </Text>

      <View className="mt-5">
        <Pressable
          className="flex-row items-center gap-2 rounded-full bg-focuslab-primary px-5 py-3"
          onPress={beginExercise}
        >
          <PlayCircle color="#FFFFFF" size={18} />
          <Text className="text-base font-semibold text-white">
            {completionData ? "Restart" : "Begin exercise"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
