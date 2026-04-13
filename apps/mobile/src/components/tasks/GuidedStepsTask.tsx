import { useEffect, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import {
  REDUCED_MOTION_DURATION,
  SPRING_FLUID,
} from "../../animations/springs";
import { useHaptics } from "../../hooks/useHaptics";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Text, TextInput, View } from "../primitives";
import { PrimaryButton } from "../ui/PrimaryButton";
import { normalizeGuidedStepsConfig } from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

function AnimatedProgressDot({
  state,
}: {
  state: "completed" | "active" | "upcoming";
}) {
  const fill = useSharedValue(state === "completed" ? 1 : 0);
  const scale = useSharedValue(state === "active" ? 1.1 : 1);
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      fill.value = withTiming(state === "completed" ? 1 : 0, {
        duration: REDUCED_MOTION_DURATION,
      });
      scale.value = withTiming(state === "active" ? 1.1 : 1, {
        duration: REDUCED_MOTION_DURATION,
      });
      return;
    }

    fill.value = withSpring(state === "completed" ? 1 : 0, SPRING_FLUID);
    scale.value = withSpring(state === "active" ? 1.1 : 1, SPRING_FLUID);
  }, [state, fill, scale, reducedMotion]);

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor:
      fill.value > 0.5
        ? "#40916C"
        : state === "active"
          ? "#FFFFFF"
          : "#D8F3DC",
    borderColor: state === "active" ? "#40916C" : "transparent",
    borderWidth: state === "active" ? 1 : 0,
    transform: [{ scaleX: scale.value }],
  }));

  return (
    <Animated.View
      className="h-2.5 flex-1 rounded-full"
      style={dotStyle}
    />
  );
}

export function GuidedStepsTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const stepsConfig = normalizeGuidedStepsConfig(config);
  const { completionSequence, lightImpact } = useHaptics();
  const [answers, setAnswers] = useState<string[]>(
    () => stepsConfig.steps.map(() => ""),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [completionData, setCompletionData] = useState<Record<string, unknown>>();

  const step = stepsConfig.steps[currentStep];
  const isLast = currentStep === stepsConfig.steps.length - 1;
  const currentAnswer = answers[currentStep] ?? "";
  const canAdvance =
    step?.inputType === "none" || currentAnswer.trim().length >= 5;

  useEffect(() => {
    onCompletionChange(Boolean(completionData), completionData);
  }, [completionData, onCompletionChange]);

  const handleNext = () => {
    if (!canAdvance) return;

    if (isLast) {
      completionSequence();
      const data: Record<string, unknown> = {};
      stepsConfig.steps.forEach((s, i) => {
        if (s.inputType !== "none") {
          data[`step_${i + 1}`] = answers[i]?.trim();
        }
      });
      setCompletionData(data);
      return;
    }

    lightImpact();
    setCurrentStep((v) => v + 1);
  };

  if (!step) return null;

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-focuslab-secondary dark:text-dark-text-secondary">
        {stepsConfig.instruction}
      </Text>

      <View className="mb-4 flex-row gap-2">
        {stepsConfig.steps.map((_, index) => (
          <AnimatedProgressDot
            key={index}
            state={
              index < currentStep
                ? "completed"
                : index === currentStep
                  ? "active"
                  : "upcoming"
            }
          />
        ))}
      </View>

      <AnimatedCardEntrance delay={0} key={currentStep}>
        <View>
          <Text className="text-xl font-bold leading-8 text-focuslab-primaryDark dark:text-dark-text-primary">
            {step.prompt}
          </Text>

          {step.inputType !== "none" && (
            <TextInput
              className="mt-4 min-h-28 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-4 text-base leading-7 text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
              multiline={step.inputType === "textarea"}
              onChangeText={(value) =>
                setAnswers((current) => {
                  const next = [...current];
                  next[currentStep] = value;
                  return next;
                })
              }
              placeholder={step.placeholder}
              textAlignVertical="top"
              value={currentAnswer}
            />
          )}
        </View>
      </AnimatedCardEntrance>

      <View className="mt-4">
        <PrimaryButton disabled={!canAdvance} onPress={handleNext}>
          {isLast ? "Finish" : "Next"}
        </PrimaryButton>
      </View>

      <Text className="mt-3 text-center text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        Step {currentStep + 1} of {stepsConfig.steps.length}
      </Text>
    </View>
  );
}
