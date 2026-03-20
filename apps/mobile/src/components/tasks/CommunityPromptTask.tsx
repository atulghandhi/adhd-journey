import { useEffect } from "react";
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

  useEffect(() => {
    // TODO: verify recent community activity and gate completion more strictly.
    onCompletionChange(true, { prompt: promptConfig.prompt });
  }, [onCompletionChange, promptConfig.prompt]);

  return (
    <View>
      <View className="rounded-2xl border-l-4 border-focuslab-primary bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
        <Text className="text-base italic leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
          {promptConfig.prompt}
        </Text>
      </View>
      <View className="mt-4">
        <PrimaryButton onPress={() => router.push(promptConfig.navigateTo as never)}>
          Open community
        </PrimaryButton>
      </View>
      <Text className="mt-3 text-sm leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
        Come back here and tap &quot;I did it&quot; after you&apos;ve posted.
      </Text>
    </View>
  );
}
