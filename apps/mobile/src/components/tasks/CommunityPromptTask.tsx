import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { View, Text } from "../primitives";
import { PrimaryButton } from "../ui/PrimaryButton";
import { normalizeCommunityPromptConfig } from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

export function CommunityPromptTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const router = useRouter();
  const promptConfig = normalizeCommunityPromptConfig(config);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    onCompletionChange(false, { prompt: promptConfig.prompt });
  }, [onCompletionChange, promptConfig.prompt]);

  const handleConfirm = useCallback(() => {
    setConfirmed(true);
    onCompletionChange(true, { prompt: promptConfig.prompt });
  }, [onCompletionChange, promptConfig.prompt]);

  return (
    <View>
      <View className="rounded-2xl border-l-4 border-focuslab-primary bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
        <Text className="text-base italic leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
          {promptConfig.prompt}
        </Text>
      </View>
      <View className="mt-4 gap-3">
        <PrimaryButton onPress={() => router.push(promptConfig.navigateTo as never)}>
          Open community
        </PrimaryButton>
        {!confirmed ? (
          <PrimaryButton onPress={handleConfirm}>
            I posted in the thread
          </PrimaryButton>
        ) : (
          <Text className="text-sm font-semibold text-focuslab-primary">
            Nice work — you can submit your check-in now.
          </Text>
        )}
      </View>
    </View>
  );
}
