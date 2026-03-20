import { useEffect, useState } from "react";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import { useHaptics } from "../../hooks/useHaptics";
import { Text, TextInput, View } from "../primitives";
import { PrimaryButton } from "../ui/PrimaryButton";
import {
  isReflectionAnswerValid,
  normalizeReflectionPromptsConfig,
} from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

export function ReflectionPromptsTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const promptsConfig = normalizeReflectionPromptsConfig(config);
  const { selectionChanged, successNotification } = useHaptics();
  const [answers, setAnswers] = useState<string[]>(
    () => promptsConfig.prompts.map(() => ""),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completionData, setCompletionData] = useState<Record<string, unknown>>();
  const currentAnswer = answers[currentIndex] ?? "";
  const isLastPrompt = currentIndex === promptsConfig.prompts.length - 1;
  const canAdvance = isReflectionAnswerValid(currentAnswer);

  useEffect(() => {
    onCompletionChange(Boolean(completionData), completionData);
  }, [completionData, onCompletionChange]);

  const handleNext = () => {
    if (!canAdvance) {
      return;
    }

    if (isLastPrompt) {
      successNotification();
      setCompletionData({ answers: answers.map((answer) => answer.trim()) });
      return;
    }

    selectionChanged();
    setCurrentIndex((value) => value + 1);
  };

  return (
    <View>
      <View className="mb-4 flex-row gap-2">
        {promptsConfig.prompts.map((prompt, index) => (
          <View
            className={`h-2.5 flex-1 rounded-full ${
              index < currentIndex
                ? "bg-focuslab-primary"
                : index === currentIndex
                  ? "border border-focuslab-primary bg-white dark:bg-dark-surface"
                  : "bg-focuslab-border dark:bg-dark-border"
            }`}
            key={prompt}
          />
        ))}
      </View>

      <AnimatedCardEntrance delay={0} key={currentIndex}>
        <View>
          <Text className="text-xl font-bold leading-8 text-focuslab-primaryDark dark:text-dark-text-primary">
            {promptsConfig.prompts[currentIndex]}
          </Text>
          <TextInput
            className="mt-4 min-h-28 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-4 text-base leading-7 text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
            multiline
            onChangeText={(value) =>
              setAnswers((current) => {
                const next = [...current];
                next[currentIndex] = value;
                return next;
              })
            }
            placeholder="Write a few sentences..."
            textAlignVertical="top"
            value={currentAnswer}
          />
        </View>
      </AnimatedCardEntrance>

      <View className="mt-4">
        <PrimaryButton disabled={!canAdvance} onPress={handleNext}>
          {isLastPrompt ? "Finish" : "Next"}
        </PrimaryButton>
      </View>
    </View>
  );
}
