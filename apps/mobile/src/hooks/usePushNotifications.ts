import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Platform } from "react-native";

import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

type PushRegistrationStatus = "denied" | "granted" | "idle" | "unavailable";

export function usePushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushRegistrationStatus>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const register = async () => {
    if (!user?.id) {
      return;
    }

    setRegistering(true);

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          importance: Notifications.AndroidImportance.DEFAULT,
          name: "default",
        });
      }

      const existing = await Notifications.getPermissionsAsync();
      let nextStatus = existing.status;

      if (nextStatus !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        nextStatus = requested.status;
      }

      if (nextStatus !== "granted") {
        setStatus("denied");
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      const pushToken = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );

      await supabase.from("push_tokens").upsert({
        platform: Platform.OS === "ios" ? "ios" : "android",
        token: pushToken.data,
        user_id: user.id,
      });

      setToken(pushToken.data);
      setStatus("granted");
    } catch {
      setStatus("unavailable");
    } finally {
      setRegistering(false);
    }
  };

  return {
    pushToken: token,
    register,
    registering,
    status,
  };
}
