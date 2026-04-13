import { Check, Square } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
import { isChecklistComplete, normalizeChecklistConfig } from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

function AnimatedCheckItem({
  checked,
  index,
  label,
  onToggle,
}: {
  checked: boolean;
  index: number;
  label: string;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);
  const labelOpacity = useSharedValue(checked ? 0.6 : 1);
  const { reducedMotion } = useReducedMotion();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (reducedMotion) {
      checkScale.value = withTiming(checked ? 1 : 0, {
        duration: REDUCED_MOTION_DURATION,
      });
      labelOpacity.value = withTiming(checked ? 0.6 : 1, {
        duration: REDUCED_MOTION_DURATION,
      });
      return;
    }

    if (checked) {
      checkScale.value = withSequence(
        withSpring(1.25, SPRING_BOUNCE),
        withSpring(1, SPRING_MAGNETIC),
      );
      labelOpacity.value = withTiming(0.6, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.02, SPRING_BOUNCE),
        withSpring(1, SPRING_MAGNETIC),
      );
    } else {
      checkScale.value = withSpring(0, SPRING_MAGNETIC);
      labelOpacity.value = withTiming(1, { duration: 150 });
    }
  }, [checked, checkScale, labelOpacity, reducedMotion, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <AnimatedCardEntrance delay={index * 60}>
      <Animated.View style={containerStyle}>
        <Pressable
          className={`flex-row items-center gap-4 rounded-2xl border px-4 py-4 ${
            checked
              ? "border-focuslab-primary bg-focuslab-background dark:border-focuslab-primary dark:bg-dark-surface"
              : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-bg"
          }`}
          onPress={onToggle}
        >
          {checked ? (
            <Animated.View
              className="h-6 w-6 items-center justify-center rounded-md bg-focuslab-primary"
              style={checkStyle}
            >
              <Check color="#FFFFFF" size={16} />
            </Animated.View>
          ) : (
            <Square color="#B7E4C7" size={24} />
          )}
          <Animated.View className="flex-1" style={labelStyle}>
            <Text
              className={`text-base leading-6 ${
                checked
                  ? "text-focuslab-primary dark:text-dark-text-secondary"
                  : "text-focuslab-primaryDark dark:text-dark-text-primary"
              }`}
            >
              {label}
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </AnimatedCardEntrance>
  );
}

export function ChecklistTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const checklistConfig = normalizeChecklistConfig(config);
  const { completionSequence, lightImpact, selectionChanged } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const [checked, setChecked] = useState<boolean[]>(
    () => checklistConfig.items.map(() => false),
  );
  const complete = isChecklistComplete(checked, checklistConfig.minChecked);
  const prevCompleteRef = useRef(false);
  const waveScales = useRef(
    checklistConfig.items.map(() => useSharedValue(1)),
  ).current;

  useEffect(() => {
    onCompletionChange(
      complete,
      complete
        ? {
            checked: checklistConfig.items
              .filter((_, i) => checked[i])
              .map((item) => item.label),
          }
        : undefined,
    );

    if (complete && !prevCompleteRef.current && !reducedMotion) {
      checked.forEach((isChecked, i) => {
        if (isChecked) {
          waveScales[i].value = withDelay(
            i * 50,
            withSequence(
              withSpring(1.04, SPRING_BOUNCE),
              withSpring(1, SPRING_MAGNETIC),
            ),
          );
        }
      });
    }

    prevCompleteRef.current = complete;
  }, [complete, checked, checklistConfig.items, onCompletionChange, reducedMotion, waveScales]);

  const toggle = (index: number) => {
    setChecked((current) => {
      const next = [...current];
      next[index] = !next[index];
      return next;
    });

    const willBeChecked = !checked[index];
    if (willBeChecked) {
      const newCheckedCount = checked.filter(Boolean).length + 1;
      if (newCheckedCount >= checklistConfig.minChecked) {
        completionSequence();
      } else {
        lightImpact();
      }
    } else {
      selectionChanged();
    }
  };

  return (
    <View>
      <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
        {checklistConfig.instruction}
      </Text>

      <View className="mt-4 gap-3">
        {checklistConfig.items.map((item, index) => (
          <AnimatedCheckItem
            checked={checked[index] ?? false}
            index={index}
            key={item.label}
            label={item.label}
            onToggle={() => toggle(index)}
          />
        ))}
      </View>

      <Text className="mt-3 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        {checked.filter(Boolean).length}/{checklistConfig.minChecked} done
      </Text>
    </View>
  );
}
