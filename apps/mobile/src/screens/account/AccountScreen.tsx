import { useRouter } from "expo-router";
import {
  buildRestartJourneyPayload,
  normalizeNotificationPreferences,
} from "@focuslab/shared";
import { useEffect, useMemo, useState } from "react";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAuth } from "../../hooks/useAuth";
import { useJourneyState } from "../../hooks/useJourneyState";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useProfile } from "../../hooks/useProfile";
import { fetchJourneyState } from "../../lib/journey-api";
import { updateProfile } from "../../lib/profile";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../providers/ToastProvider";
import { useOfflineQueueStore } from "../../stores/offlineQueueStore";

export function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: state, refetch: refetchJourney } = useJourneyState();
  const { showToast } = useToast();
  const pendingCheckIns = useOfflineQueueStore((store) => store.pendingCheckIns);
  const [savingTheme, setSavingTheme] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [quietStart, setQuietStart] = useState("21:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const { pushToken, register, registering, status: pushStatus } =
    usePushNotifications();
  const notificationPreferences = useMemo(
    () => normalizeNotificationPreferences(profile?.notification_preferences),
    [profile?.notification_preferences],
  );

  useEffect(() => {
    setQuietStart(notificationPreferences.quiet_start);
    setQuietEnd(notificationPreferences.quiet_end);
  }, [notificationPreferences.quiet_end, notificationPreferences.quiet_start]);

  const persistNotificationPreferences = async (overrides?: {
    channels?: ("email" | "push")[];
    quiet_end?: string;
    quiet_start?: string;
  }) => {
    if (!user?.id) {
      return;
    }

    setSavingPrefs(true);

    try {
      await updateProfile(user.id, {
        notification_preferences: {
          ...notificationPreferences,
          channels:
            overrides?.channels ?? [...notificationPreferences.channels] as ("email" | "push")[],
          quiet_end: overrides?.quiet_end ?? quietEnd,
          quiet_start: overrides?.quiet_start ?? quietStart,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      });
      await refetchProfile();
      showToast("Notification preferences saved.");
    } catch {
      showToast("Couldn’t update notification preferences.", "error");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleThemeChange = async (theme: "dark" | "light" | "system") => {
    if (!user?.id) {
      return;
    }

    setSavingTheme(theme);

    try {
      await updateProfile(user.id, { theme_preference: theme });
      await refetchProfile();
      showToast("Theme preference saved.");
    } catch {
      showToast("Couldn’t update your theme preference.", "error");
    } finally {
      setSavingTheme(null);
    }
  };

  const handleChannelToggle = async (channel: "email" | "push") => {
    const channels = notificationPreferences.channels.includes(channel)
      ? notificationPreferences.channels.filter((value) => value !== channel)
      : [...notificationPreferences.channels, channel];

    await persistNotificationPreferences({
      channels: channels.length > 0 ? channels : [channel],
    });
  };

  const handleQuietHoursSave = async () => {
    if (!/^\d{2}:\d{2}$/.test(quietStart) || !/^\d{2}:\d{2}$/.test(quietEnd)) {
      showToast("Quiet hours should use HH:MM format.", "error");
      return;
    }

    await persistNotificationPreferences({
      quiet_end: quietEnd,
      quiet_start: quietStart,
    });
  };

  const handleRestart = async () => {
    if (!user?.id || !profile) {
      return;
    }

    try {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .order("order");

      if (error || !tasks) {
        throw error ?? new Error("Tasks could not be loaded.");
      }

      const payload = buildRestartJourneyPayload({
        currentJourneyId: profile.current_journey_id,
        tasks,
        userId: user.id,
      });

      const [{ error: profileError }, { error: progressError }] = await Promise.all([
        supabase.from("profiles").update(payload.profileUpdate).eq("id", user.id),
        supabase.from("user_progress").insert(payload.progress),
      ]);

      if (profileError) {
        throw profileError;
      }

      if (progressError) {
        throw progressError;
      }

      await refetchProfile();
      await refetchJourney();
      showToast("Journey restarted.");
    } catch {
      showToast("Couldn’t restart your journey.", "error");
    }
  };

  const handleSyncPending = async () => {
    try {
      await fetchJourneyState();
      await refetchJourney();
      showToast("We checked for queued progress.");
    } catch {
      showToast("Couldn’t sync pending check-ins yet.", "error");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
            Account
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
            {profile?.name ? `${profile.name}'s settings` : "Your settings"}
          </Text>
        </View>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Theme preference
          </Text>
          <View className="mt-4 gap-3">
            {(["light", "dark", "system"] as const).map((theme) => (
              <PrimaryButton
                key={theme}
                loading={savingTheme === theme}
                onPress={() => {
                  void handleThemeChange(theme);
                }}
              >
                {profile?.theme_preference === theme ? `✓ ${theme}` : theme}
              </PrimaryButton>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Notifications
          </Text>
          <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
            Your local timezone is{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}.
          </Text>
          <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
            FocusLab uses your saved quiet hours and alternates between push and email
            when it can.
          </Text>
          <View className="mt-4 gap-3">
            {(["push", "email"] as const).map((channel) => (
              <PrimaryButton
                key={channel}
                loading={savingPrefs}
                onPress={() => {
                  void handleChannelToggle(channel);
                }}
              >
                {notificationPreferences.channels.includes(channel)
                  ? `✓ ${channel}`
                  : channel}
              </PrimaryButton>
            ))}
          </View>
          <View className="mt-4 gap-3">
            <TextInput
              className="min-h-12 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark"
              onChangeText={setQuietStart}
              placeholder="Quiet start (21:00)"
              value={quietStart}
            />
            <TextInput
              className="min-h-12 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark"
              onChangeText={setQuietEnd}
              placeholder="Quiet end (08:00)"
              value={quietEnd}
            />
            <PrimaryButton
              loading={savingPrefs}
              onPress={() => {
                void handleQuietHoursSave();
              }}
            >
              Save quiet hours
            </PrimaryButton>
            <PrimaryButton
              loading={registering}
              onPress={() => {
                void register()
                  .then(() => showToast("Push registration updated."))
                  .catch(() =>
                    showToast("Couldn’t register this device for push yet.", "error"),
                  );
              }}
            >
              Register push notifications
            </PrimaryButton>
          </View>
          <Text className="mt-3 text-sm text-focuslab-secondary">
            Push status: {pushStatus}
            {pushToken ? " • token stored" : ""}
          </Text>
        </AppCard>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Extras
          </Text>
          <View className="mt-4 gap-3">
            <PrimaryButton onPress={() => router.push("/completion/resources" as never)}>
              Open resources
            </PrimaryButton>
            <PrimaryButton onPress={() => router.push("/completion/quiz" as never)}>
              Take the quiz
            </PrimaryButton>
            <PrimaryButton onPress={handleRestart}>Restart journey</PrimaryButton>
          </View>
        </AppCard>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Offline queue
          </Text>
          <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
            Pending check-ins: {pendingCheckIns.length}
          </Text>
          <View className="mt-4">
            <PrimaryButton onPress={() => void handleSyncPending()}>
              Check sync status
            </PrimaryButton>
          </View>
        </AppCard>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Billing
          </Text>
          <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
            {profile?.payment_status === "paid"
              ? "Your paid tier is unlocked."
              : "You’re on the free tier for Days 1–15."}
          </Text>
          {profile?.payment_status !== "paid" ? (
            <View className="mt-4">
              <PrimaryButton onPress={() => router.push("/payment/paywall" as never)}>
                View paywall
              </PrimaryButton>
            </View>
          ) : null}
        </AppCard>

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark">
            Sign out
          </Text>
          <View className="mt-4">
            <PrimaryButton onPress={handleSignOut}>Sign out</PrimaryButton>
          </View>
          <Text className="mt-3 text-sm text-focuslab-secondary">
            Current journey: {state?.activeTaskOrder ?? "Finished"}
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
