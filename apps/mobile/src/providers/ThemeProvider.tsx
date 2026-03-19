import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";
import { useColorScheme } from "nativewind";

import { useAuth } from "../hooks/useAuth";
import { useProfilePreferences } from "../hooks/useProfilePreferences";

const THEME_CACHE_KEY = "focuslab-theme-preference";

function resolveScheme(
  theme: "dark" | "light" | "system",
  deviceScheme: string | null | undefined,
): "dark" | "light" {
  if (theme === "system") {
    return deviceScheme === "dark" ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const { setColorScheme } = useColorScheme();
  const deviceScheme = useDeviceColorScheme();
  const { isLoading: authLoading, user } = useAuth();
  const { isLoading: profileLoading, preferences } = useProfilePreferences();
  const appliedResolvedTheme = useRef(false);

  // On mount, apply the cached theme immediately to avoid a flash.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_CACHE_KEY)
      .then((cached) => {
        if (cancelled || appliedResolvedTheme.current) {
          return;
        }

        if (cached === "dark" || cached === "light" || cached === "system") {
          setColorScheme(resolveScheme(cached, deviceScheme));
        }
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply and persist whenever the profile-derived preference changes.
  useEffect(() => {
    if (authLoading || (user?.id && profileLoading)) {
      return;
    }

    appliedResolvedTheme.current = true;
    const resolved = resolveScheme(preferences.theme, deviceScheme);
    setColorScheme(resolved);
    void AsyncStorage.setItem(THEME_CACHE_KEY, preferences.theme).catch(() => null);
  }, [
    authLoading,
    deviceScheme,
    preferences.theme,
    profileLoading,
    setColorScheme,
    user?.id,
  ]);

  return <>{children}</>;
}
