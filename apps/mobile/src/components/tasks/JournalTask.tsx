import { useEffect, useState } from "react";

import { Text, TextInput, View } from "../primitives";
import { useHaptics } from "../../hooks/useHaptics";
import {
  isJournalComplete,
  normalizeJournalConfig,
} from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

export function JournalTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const journalConfig = normalizeJournalConfig(config);
  const { successNotification } = useHaptics();
  const [entry, setEntry] = useState("");
  const [hasCelebratedThreshold, setHasCelebratedThreshold] = useState(false);
  const complete = isJournalComplete(entry, journalConfig.minCharacters);

  useEffect(() => {
    onCompletionChange(complete, complete ? { entry } : undefined);
  }, [complete, entry, onCompletionChange]);

  useEffect(() => {
    if (complete && !hasCelebratedThreshold) {
      successNotification();
      setHasCelebratedThreshold(true);
    }

    if (!complete && hasCelebratedThreshold) {
      setHasCelebratedThreshold(false);
    }
  }, [complete, hasCelebratedThreshold, successNotification]);

  return (
    <View>
      <View className="rounded-2xl bg-focuslab-border px-4 py-4 dark:bg-dark-border">
        <Text className="text-base italic leading-7 text-focuslab-primaryDark dark:text-dark-text-primary">
          {journalConfig.prompt}
        </Text>
      </View>
      <TextInput
        className="mt-4 min-h-52 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-4 text-base leading-7 text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
        multiline
        onChangeText={setEntry}
        placeholder="Start writing..."
        textAlignVertical="top"
        value={entry}
      />
      <Text
        className={`mt-3 text-sm font-medium ${
          complete
            ? "text-focuslab-primary"
            : "text-focuslab-secondary dark:text-dark-text-secondary"
        }`}
      >
        {entry.trim().length}/{journalConfig.minCharacters} characters
      </Text>
    </View>
  );
}
