import { useRouter } from "expo-router";
import { useState } from "react";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { useHaptics } from "../../hooks/useHaptics";
import { SafeAreaView, Text, View } from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { updateProfile } from "../../lib/profile";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../providers/ToastProvider";

const FOCUS_AREAS = [
  {
    label: "Starting work / getting going in the morning",
    value: "mornings",
  },
  {
    label: "Phone and screen time",
    value: "screen_time",
  },
  {
    label: "Keeping up with home and life admin",
    value: "life_admin",
  },
  {
    label: "Focus during study or deep work",
    value: "deep_work",
  },
  {
    label: "Everything feels chaotic",
    value: "overwhelm",
  },
] as const;

export type FocusAreaValue = (typeof FOCUS_AREAS)[number]["value"];

export function FocusAreaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { selectionChanged } = useHaptics();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = (value: string) => {
    selectionChanged();
    setSelected(value);
  };

  const handleContinue = async () => {
    if (!user?.id || !selected) {
      return;
    }

    setSaving(true);

    try {
      await updateProfile(user.id, { focus_area: selected });
      router.push("/onboarding/motivation" as never);
    } catch {
      showToast("Couldn't save your selection just yet.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
          What's hardest right now?
        </Text>
        <Text className="mt-3 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
          Pick the one that feels most true today. This helps us personalise your
          experience (you can change it later).
        </Text>

        <View className="mt-6 gap-3">
          {FOCUS_AREAS.map((area) => (
            <AnimatedPressable
              key={area.value}
              onPress={() => handleSelect(area.value)}
            >
              <View
                className={`rounded-2xl border px-4 py-4 ${
                  selected === area.value
                    ? "border-focuslab-primary bg-focuslab-background dark:border-focuslab-primary dark:bg-dark-bg"
                    : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-surface"
                }`}
              >
                <Text
                  className={`text-base font-medium leading-6 ${
                    selected === area.value
                      ? "text-focuslab-primary"
                      : "text-focuslab-primaryDark dark:text-dark-text-primary"
                  }`}
                >
                  {area.label}
                </Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        <View className="mt-8">
          <PrimaryButton
            disabled={!selected}
            loading={saving}
            onPress={() => {
              void handleContinue();
            }}
          >
            Continue
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
