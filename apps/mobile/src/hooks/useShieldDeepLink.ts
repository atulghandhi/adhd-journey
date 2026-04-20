import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useRouter } from "expo-router";

import { readPendingDeepLink } from "../../modules/widget-data-bridge";

/**
 * Picks up deep-links written by the ShieldAction extension to the shared
 * App Group UserDefaults ("group.app.nextthing" / key "pendingDeepLink")
 * and routes the app accordingly.
 *
 * The Shield writes the link when the user taps the primary button on a
 * shielded app/site. Because the action runs inside an app extension it
 * cannot itself open the containing app — so this hook checks on mount
 * and whenever the app comes to the foreground and consumes the link.
 */
export function useShieldDeepLink(): void {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const consume = () => {
      try {
        const pending = readPendingDeepLink({ clear: true });
        if (!pending?.link) return;
        // Only act on links written within the last 10 minutes so we don't
        // hijack navigation from stale values.
        const ageSeconds = Date.now() / 1000 - (pending.at ?? 0);
        if (ageSeconds > 600) return;

        if (pending.link === "disrupt") {
          router.push("/disrupt");
        }
      } catch (err) {
        // Swallow — surface in logs for debugging but never crash.
        console.warn("[useShieldDeepLink] failed to consume pending link:", err);
      }
    };

    // On mount (cold start after user tapped Disrupt from the shield).
    consume();

    // On foreground (user tapped shield, then swiped back to our app).
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") consume();
    });

    return () => subscription.remove();
  }, [router]);
}
