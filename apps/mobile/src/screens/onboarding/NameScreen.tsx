import { useRouter } from "expo-router";
import { useState } from "react";

import { SafeAreaView, Text, TextInput, View } from "../../components/primitives";
import { updateProfile } from "../../lib/profile";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../providers/ToastProvider";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

export function NameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!user?.id || name.trim().length === 0) {
      return;
    }

    setSaving(true);

    try {
      await updateProfile(user.id, { name: name.trim() });
      router.push("/onboarding/motivation" as never);
    } catch {
      showToast("Couldn’t save your name just yet.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-focuslab-primaryDark">
          What should we call you?
        </Text>
        <Text className="mt-3 text-base leading-7 text-focuslab-secondary">
          We use your name in community threads and a few encouragement moments.
        </Text>

        <View className="mt-8 rounded-[24px] bg-white p-6">
          <TextInput
            className="min-h-12 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark"
            onChangeText={setName}
            placeholder="Your name"
            value={name}
          />
          <View className="mt-6">
            <PrimaryButton
              disabled={name.trim().length === 0}
              loading={saving}
              onPress={() => {
                void handleContinue();
              }}
            >
              Continue
            </PrimaryButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
