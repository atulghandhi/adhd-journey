import { PauseCircle, PlayCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Circle, Svg } from "react-native-svg";
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
  getSecondsRemaining,
  normalizeTimedChallengeConfig,
} from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

const TIMER_SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimedChallengeTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const challengeConfig = normalizeTimedChallengeConfig(config);
  const { lightImpact, successNotification } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const [secondsRemaining, setSecondsRemaining] = useState(
    challengeConfig.durationSeconds,
  );
  const [targetTimeMs, setTargetTimeMs] = useState<number | null>(null);
  const [completionData, setCompletionData] = useState<Record<string, unknown>>();
  const [phaseLabel, setPhaseLabel] = useState<string | null>(
    challengeConfig.breathingCadence ? "Breathe in" : null,
  );
  const phaseRef = useRef<string | null>(null);
  const scale = useSharedValue(1);
  const progress =
    (challengeConfig.durationSeconds - secondsRemaining) /
    challengeConfig.durationSeconds;

  useEffect(() => {
    onCompletionChange(Boolean(completionData), completionData);
  }, [completionData, onCompletionChange]);

  useEffect(() => {
    if (!targetTimeMs || completionData) {
      return;
    }

    const updateCountdown = () => {
      const nextRemaining = getSecondsRemaining(targetTimeMs);
      const elapsedSeconds = Math.max(
        0,
        challengeConfig.durationSeconds - nextRemaining,
      );

      setSecondsRemaining(nextRemaining);

      if (challengeConfig.breathingCadence) {
        const nextPhase = getBreathingPhaseLabel(
          elapsedSeconds,
          challengeConfig.breathingCadence,
        );
        setPhaseLabel(nextPhase);

        if (phaseRef.current && phaseRef.current !== nextPhase) {
          lightImpact();
        }

        phaseRef.current = nextPhase;
      }

      if (nextRemaining === 0) {
        successNotification();
        setCompletionData({
          completedAt: new Date().toISOString(),
          durationSeconds: challengeConfig.durationSeconds,
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 250);

    return () => {
      clearInterval(timer);
    };
  }, [
    challengeConfig.breathingCadence,
    challengeConfig.durationSeconds,
    completionData,
    lightImpact,
    successNotification,
    targetTimeMs,
  ]);

  useEffect(() => {
    if (!targetTimeMs || !challengeConfig.breathingCadence || completionData) {
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
        withTiming(1.15, {
          duration: challengeConfig.breathingCadence.inhaleSeconds * 1000,
        }),
        withTiming(1.15, {
          duration: challengeConfig.breathingCadence.holdSeconds * 1000,
        }),
        withTiming(1, {
          duration: challengeConfig.breathingCadence.exhaleSeconds * 1000,
        }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 120 });
    };
  }, [
    challengeConfig.breathingCadence,
    completionData,
    reducedMotion,
    scale,
    targetTimeMs,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const beginChallenge = () => {
    setCompletionData(undefined);
    setSecondsRemaining(challengeConfig.durationSeconds);
    setTargetTimeMs(Date.now() + challengeConfig.durationSeconds * 1000);
    phaseRef.current = null;
    setPhaseLabel(challengeConfig.breathingCadence ? "Breathe in" : null);
  };

  return (
    <View className="items-center">
      <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
        {challengeConfig.label}
      </Text>

      <Animated.View className="mt-6" style={animatedStyle}>
        <Svg height={TIMER_SIZE} width={TIMER_SIZE}>
          <Circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            fill="none"
            r={RADIUS}
            stroke="#B7E4C7"
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            fill="none"
            r={RADIUS}
            rotation="-90"
            stroke="#40916C"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-4xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            {formatSeconds(secondsRemaining)}
          </Text>
        </View>
      </Animated.View>

      {phaseLabel ? (
        <Text className="mt-4 text-base font-medium text-focuslab-secondary dark:text-dark-text-secondary">
          {phaseLabel}
        </Text>
      ) : null}

      <Text className="mt-3 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        {secondsRemaining} seconds remaining
      </Text>

      <View className="mt-5">
        {!targetTimeMs || completionData ? (
          <Pressable
            className="flex-row items-center gap-2 rounded-full bg-focuslab-primary px-5 py-3"
            onPress={beginChallenge}
          >
            <PlayCircle color="#FFFFFF" size={18} />
            <Text className="text-base font-semibold text-white">
              {completionData ? "Try again" : "Begin"}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-2 rounded-full bg-focuslab-border px-5 py-3 dark:bg-dark-border">
            <PauseCircle color="#40916C" size={18} />
            <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
              Timer running
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
