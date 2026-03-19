import { useState } from "react";
import {
  Modal,
  Switch,
  Pressable as RNPressable,
} from "react-native";

import type { CompletionCheckInInput } from "@focuslab/shared";

import { EmojiRating } from "../../components/EmojiRating";
import {
  ScrollView,
  Text,
  TextInput,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

interface CheckInSheetProps {
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: CompletionCheckInInput) => Promise<void>;
  visible: boolean;
}

export function CheckInSheet({
  loading,
  onClose,
  onSubmit,
  visible,
}: CheckInSheetProps) {
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [triedIt, setTriedIt] = useState(true);
  const [whatHappened, setWhatHappened] = useState("");
  const [whatWasHard, setWhatWasHard] = useState("");
  const [whatSurprised, setWhatSurprised] = useState("");

  const handleSubmit = async () => {
    if (!quickRating) {
      return;
    }

    await onSubmit({
      checkedInAt: new Date().toISOString(),
      promptResponses: {
        what_happened: whatHappened,
        what_surprised: whatSurprised,
        what_was_hard: whatWasHard,
      },
      quickRating,
      timeSpentSeconds: 0,
      triedIt,
    });
    onClose();
    setQuickRating(null);
    setWhatHappened("");
    setWhatWasHard("");
    setWhatSurprised("");
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/30">
        <RNPressable onPress={onClose} style={{ flex: 1 }} />
        <ScrollView className="max-h-[80%] rounded-t-[30px] bg-white px-6 py-6 dark:bg-dark-surface">
          <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Quick check-in
          </Text>
          <Text className="mt-2 text-base leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
            This should take less than 10 seconds unless you want to add more detail.
          </Text>

          <View className="mt-6 gap-4">
            <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              How did it feel?
            </Text>
            <EmojiRating onChange={setQuickRating} value={quickRating} />
          </View>

          <View className="mt-6 flex-row items-center justify-between rounded-2xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
            <View className="flex-1 pr-4">
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Did you try it?
              </Text>
              <Text className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
                A quick yes or no helps the algorithm decide whether to extend the task.
              </Text>
            </View>
            <Switch onValueChange={setTriedIt} value={triedIt} />
          </View>

          <View className="mt-6 gap-3">
            <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              Optional deeper reflection
            </Text>
            <TextInput
              className="min-h-24 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
              multiline
              onChangeText={setWhatHappened}
              placeholder="What happened?"
              textAlignVertical="top"
              value={whatHappened}
            />
            <TextInput
              className="min-h-24 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
              multiline
              onChangeText={setWhatWasHard}
              placeholder="What was hard?"
              textAlignVertical="top"
              value={whatWasHard}
            />
            <TextInput
              className="min-h-24 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
              multiline
              onChangeText={setWhatSurprised}
              placeholder="What surprised you?"
              textAlignVertical="top"
              value={whatSurprised}
            />
          </View>

          <View className="mt-8">
            <PrimaryButton
              disabled={!quickRating}
              loading={loading}
              onPress={() => {
                void handleSubmit();
              }}
            >
              Save check-in
            </PrimaryButton>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
