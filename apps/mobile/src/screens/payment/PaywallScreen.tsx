import { useRouter } from "expo-router";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { updateProfile } from "../../lib/profile";
import { useAuth } from "../../hooks/useAuth";
import { useEntitlement } from "../../hooks/useEntitlement";
import { purchasePrimaryOffering } from "../../lib/revenuecat";
import { useToast } from "../../providers/ToastProvider";

export function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConfigured, offering, profile, refresh } = useEntitlement();
  const { showToast } = useToast();

  const handleDevUnlock = async () => {
    if (!user?.id) {
      return;
    }

    try {
      await updateProfile(user.id, { payment_status: "paid" });
      await refresh();
      showToast("Paid tier unlocked in dev mode.");
      router.replace("/journey" as never);
    } catch {
      showToast("Couldn’t unlock the paid tier just yet.", "error");
    }
  };

  const handlePurchase = async () => {
    if (!user?.id) {
      return;
    }

    if (!isConfigured) {
      showToast("RevenueCat isn’t configured in this build. Use dev unlock below.", "error");
      return;
    }

    const result = await purchasePrimaryOffering(user.id);

    if (!result.purchased) {
      showToast("Purchase didn’t complete. Please try again.", "error");
      return;
    }

    await refresh();
    showToast("Purchase complete.");
    router.replace("/journey" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <AppCard>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
            Day 16 unlock
          </Text>
          <Text className="mt-3 text-3xl font-bold leading-9 text-focuslab-primaryDark">
            You&apos;ve completed 15 days. The next 15 unlock:
          </Text>
          <Text className="mt-4 text-base leading-7 text-focuslab-secondary">
            You said you wanted to: {profile?.motivating_answer ?? "build real focus"}.
          </Text>
          <View className="mt-6 gap-3">
            <Text className="text-base leading-7 text-focuslab-primaryDark">
              • deeper strategies for energy, systems, and follow-through
            </Text>
            <Text className="text-base leading-7 text-focuslab-primaryDark">
              • community access for the full 30-day journey
            </Text>
            <Text className="text-base leading-7 text-focuslab-primaryDark">
              • the reward bundle and post-completion resources
            </Text>
          </View>
          <Text className="mt-6 text-2xl font-bold text-focuslab-primaryDark">
            {offering?.priceString ?? "£8"} one time — not a subscription
          </Text>
          <View className="mt-6 gap-3">
            <PrimaryButton
              onPress={() => {
                void handlePurchase();
              }}
            >
              Purchase unlock
            </PrimaryButton>
            {!isConfigured ? (
              <PrimaryButton onPress={() => void handleDevUnlock()}>
                Dev mode: tap to unlock paid tier
              </PrimaryButton>
            ) : null}
            <PrimaryButton onPress={() => router.back()}>Maybe later</PrimaryButton>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
