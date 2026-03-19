import { useMemo } from "react";
import { normalizeNotificationPreferences } from "@focuslab/shared";

import { useProfile } from "./useProfile";

export interface ProfilePreferences {
  reducedMotion: boolean;
  theme: "dark" | "light" | "system";
}

export function useProfilePreferences() {
  const { data: profile, isLoading } = useProfile();

  const preferences = useMemo<ProfilePreferences>(() => {
    const notifPrefs = normalizeNotificationPreferences(
      profile?.notification_preferences,
    );

    return {
      reducedMotion: notifPrefs.reduced_motion === true,
      theme: (profile?.theme_preference as "dark" | "light" | "system") ?? "system",
    };
  }, [profile?.notification_preferences, profile?.theme_preference]);

  return { isLoading, preferences, profile };
}
