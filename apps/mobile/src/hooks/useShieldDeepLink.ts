import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useRouter } from "expo-router";

import { readPendingDeepLink } from "../../modules/widget-data-bridge";
import {
  enforceShields,
  isFamilyControlsAvailable,
  setGatewayPauseSeconds,
} from "../../modules/family-controls-bridge";
import { useGatewayStore } from "../stores/gatewayStore";

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
  const breathDurationSeconds = useGatewayStore(
    (s) => s.config.breathDurationSeconds,
  );

  // Keep the shield extensions in sync with the configured pause duration,
  // even if the user never revisits the gateway settings screen.
  useEffect(() => {
    if (Platform.OS !== "ios" || !isFamilyControlsAvailable()) return;
    void setGatewayPauseSeconds(breathDurationSeconds);
  }, [breathDurationSeconds]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const consume = () => {
      console.log("[useShieldDeepLink] consume called");
      try {
        const pending = readPendingDeepLink({ clear: true });
        console.log("[useShieldDeepLink] pending deep link data:", pending);
        if (!pending?.link) {
          console.log("[useShieldDeepLink] no pending link found.");
          return;
        }
        // Only act on links written within the last 3 minutes so we don't
        // hijack navigation from stale values (e.g. the user finished the
        // in-shield breathing flow and opens Next Thing for something else).
        const ageSeconds = Date.now() / 1000 - (pending.at ?? 0);
        console.log(`[useShieldDeepLink] link age: ${ageSeconds} seconds`);
        if (ageSeconds > 180) {
          console.log("[useShieldDeepLink] link is stale, ignoring.");
          return;
        }

        if (pending.link === "disrupt") {
          console.log("[useShieldDeepLink] routing to /disrupt");
          router.push("/disrupt");
        } else {
          console.log(`[useShieldDeepLink] unknown link type: ${pending.link}`);
        }
      } catch (err) {
        // Swallow — surface in logs for debugging but never crash.
        console.warn("[useShieldDeepLink] failed to consume pending link:", err);
      }
    };

    // Restore shields whose unlock window has expired. The ShieldAction
    // extension can be terminated before its own re-apply timer fires, so
    // the main app enforces the persisted deadline whenever it comes alive.
    const enforce = () => {
      if (isFamilyControlsAvailable()) void enforceShields();
    };

    // On mount (cold start after user tapped Disrupt from the shield).
    consume();
    enforce();

    // On foreground (user tapped shield, then swiped back to our app).
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        consume();
        enforce();
      }
    });

    return () => subscription.remove();
  }, [router]);
}
