import { Clock, Pause, Play, Square } from "lucide-react-native";
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

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import {
  REDUCED_MOTION_DURATION,
  SPRING_BOUNCE,
  SPRING_MAGNETIC,
} from "../../animations/springs";
import { useHaptics } from "../../hooks/useHaptics";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Pressable, Text, View } from "../primitives";
import { formatSeconds, normalizeTimeTrackerConfig } from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

type TrackerState = "idle" | "running" | "paused" | "done";

export function TimeTrackerTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const trackerConfig = normalizeTimeTrackerConfig(config);
  const { completionSequence, mediumImpact, selectionChanged } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const [state, setState] = useState<TrackerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circleScale = useSharedValue(1);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setElapsed((v) => v + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  useEffect(() => {
    if (state === "done") {
      onCompletionChange(true, {
        elapsedSeconds: elapsed,
        estimateMinutes: trackerConfig.estimateMinutes,
        taskLabel: trackerConfig.taskLabel,
      });
    } else {
      onCompletionChange(false);
    }
  }, [state, elapsed, trackerConfig, onCompletionChange]);

  // Breathing pulse while running, spring transitions on state change
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(circleScale);
      circleScale.value = 1;
      return;
    }

    if (state === "running") {
      circleScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else if (state === "paused") {
      cancelAnimation(circleScale);
      circleScale.value = withSpring(0.97, SPRING_MAGNETIC);
    } else if (state === "done") {
      cancelAnimation(circleScale);
      circleScale.value = withSequence(
        withSpring(1.08, SPRING_BOUNCE),
        withSpring(1, SPRING_MAGNETIC),
      );
    } else {
      cancelAnimation(circleScale);
      circleScale.value = withSpring(1, SPRING_MAGNETIC);
    }

    return () => {
      cancelAnimation(circleScale);
    };
  }, [state, reducedMotion, circleScale]);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const handleStart = () => {
    mediumImpact();
    setState("running");
  };

  const handlePause = () => {
    selectionChanged();
    setState("paused");
  };

  const handleResume = () => {
    mediumImpact();
    setState("running");
  };

  const handleStop = () => {
    completionSequence();
    setState("done");
  };

  const estimateDisplay = trackerConfig.estimateMinutes > 0
    ? `Estimate: ${trackerConfig.estimateMinutes} min`
    : null;

  return (
    <View>
      <AnimatedCardEntrance delay={0}>
        <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
          {trackerConfig.instruction}
        </Text>

        <View className="mt-6 items-center">
          <Animated.View
            className="h-40 w-40 items-center justify-center rounded-full border-4 border-focuslab-primary bg-focuslab-background dark:bg-dark-surface"
            style={circleAnimatedStyle}
          >
            <Clock color="#40916C" size={24} />
            <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {formatSeconds(elapsed)}
            </Text>
          </Animated.View>

          {estimateDisplay && state !== "done" && (
            <Text className="mt-3 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
              {estimateDisplay}
            </Text>
          )}

          <Text className="mt-2 text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
            {trackerConfig.taskLabel}
          </Text>
        </View>

        <View className="mt-6 flex-row justify-center gap-4">
          {state === "idle" && (
            <Pressable
              className="flex-row items-center gap-2 rounded-2xl bg-focuslab-primary px-8 py-4"
              onPress={handleStart}
            >
              <Play color="#FFFFFF" size={18} />
              <Text className="text-base font-semibold text-white">Start</Text>
            </Pressable>
          )}

          {state === "running" && (
            <>
              <Pressable
                className="flex-row items-center gap-2 rounded-2xl bg-focuslab-border px-6 py-4 dark:bg-dark-border"
                onPress={handlePause}
              >
                <Pause color="#40916C" size={18} />
                <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">Pause</Text>
              </Pressable>
              <Pressable
                className="flex-row items-center gap-2 rounded-2xl bg-focuslab-primary px-6 py-4"
                onPress={handleStop}
              >
                <Square color="#FFFFFF" size={18} />
                <Text className="text-base font-semibold text-white">Done</Text>
              </Pressable>
            </>
          )}

          {state === "paused" && (
            <>
              <Pressable
                className="flex-row items-center gap-2 rounded-2xl bg-focuslab-primary px-6 py-4"
                onPress={handleResume}
              >
                <Play color="#FFFFFF" size={18} />
                <Text className="text-base font-semibold text-white">Resume</Text>
              </Pressable>
              <Pressable
                className="flex-row items-center gap-2 rounded-2xl bg-focuslab-border px-6 py-4 dark:bg-dark-border"
                onPress={handleStop}
              >
                <Square color="#40916C" size={18} />
                <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">Done</Text>
              </Pressable>
            </>
          )}

          {state === "done" && (
            <View className="items-center">
              <Text className="text-lg font-bold text-focuslab-primary">
                Total: {formatSeconds(elapsed)}
              </Text>
              {trackerConfig.estimateMinutes > 0 && (
                <Text className="mt-1 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
                  {elapsed > trackerConfig.estimateMinutes * 60
                    ? `Took ${Math.round((elapsed - trackerConfig.estimateMinutes * 60) / 60)} min longer than expected`
                    : `Finished ${Math.round((trackerConfig.estimateMinutes * 60 - elapsed) / 60)} min ahead of estimate`}
                </Text>
              )}
            </View>
          )}
        </View>
      </AnimatedCardEntrance>
    </View>
  );
}
