import { useRouter } from "expo-router";
import { useState } from "react";

import { SafeAreaView, Text, TextInput, View } from "../../components/primitives";
import { updateProfile } from "../../lib/profile";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../providers/ToastProvider";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

export function MotivationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user?.id) {
      return;
    }

    setSaving(true);

    try {
      await updateProfile(user.id, {
        motivating_answer: answer.trim(),
        onboarding_complete: true,
      });
      router.replace("/journey" as never);
    } catch {
      showToast("Couldn’t finish onboarding just yet.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-focuslab-primaryDark">
          What&apos;s the one thing you&apos;d do if you could actually focus?
        </Text>
        <Text className="mt-3 text-base leading-7 text-focuslab-secondary">
          Write a book, learn guitar, finish your project. We&apos;ll bring this
          back when you need a reminder.
        </Text>

        <View className="mt-8 rounded-[24px] bg-white p-6">
          <TextInput
            className="min-h-32 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-4 text-base text-focuslab-primaryDark"
            maxLength={200}
            multiline
            onChangeText={setAnswer}
            placeholder="Write a book, learn guitar, finish my project..."
            textAlignVertical="top"
            value={answer}
          />
          <Text className="mt-2 text-right text-sm text-gray-500">
            {answer.length}/200
          </Text>
          <View className="mt-6">
            <PrimaryButton
              disabled={answer.trim().length === 0}
              loading={saving}
              onPress={() => {
                void handleFinish();
              }}
            >
              Start Day 1
            </PrimaryButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
