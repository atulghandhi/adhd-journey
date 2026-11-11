import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { usePathname, useRouter } from "expo-router";

import { toNativeGatewayConfig } from "@focuslab/shared";

import {
  consumePendingShieldRequest,
  isFamilyControlsAvailable,
} from "../../modules/family-controls-bridge";
import { syncGatewayFromStore } from "../lib/gateway";
import { useGatewayStore } from "../stores/gatewayStore";

/** True once the persisted gateway settings have been read from storage. */
function useGatewayHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useGatewayStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useGatewayStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useGatewayStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}

/**
 * Connects the app to its Screen Time shields.
 *
 * 1. Hand-off: when the user taps "Take a breath" on a shield, the
 *    ShieldAction extension leaves a request in the shared App Group and iOS
 *    brings Next Thing forward (directly on iOS 26.5+, through a notification
 *    tap before that). This hook picks the request up whenever the app
 *    becomes active and opens the breathing screen.
 *
 * 2. Enforcement: it keeps the native layer in step with the settings, on
 *    launch, on every foreground and whenever a setting changes. That covers
 *    restoring shields after an unlock session whose background timer did
 *    not fire.
 */
export function useShieldDeepLink(): void {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useGatewayHydrated();

  // Only the settings native cares about; unrelated config edits don't re-sync.
  const nativeConfigKey = useGatewayStore((s) =>
    JSON.stringify(toNativeGatewayConfig(s.config)),
  );

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Settings sync. Waits for hydration: syncing the not-yet-loaded defaults
  // (App Disrupt off) would briefly drop every shield on each cold launch.
  useEffect(() => {
    if (!hydrated) return;
    void syncGatewayFromStore();
  }, [hydrated, nativeConfigKey]);

  useEffect(() => {
    if (!hydrated || !isFamilyControlsAvailable()) return;

    let busy = false;

    const handleActive = async () => {
      if (busy) return;
      busy = true;
      try {
        const request = await consumePendingShieldRequest();
        // Sync first so the breathing screen starts from today's open count.
        await syncGatewayFromStore();

        if (request) {
          useGatewayStore.getState().setShieldRequest(request);
          const href = `/disrupt?r=${Math.round(request.at)}`;
          // Replace a breathing screen that is already up instead of
          // stacking a second one on top of it.
          if (pathnameRef.current === "/disrupt") {
            router.replace(href as never);
          } else {
            router.push(href as never);
          }
        }
      } catch (err) {
        // Never let shield plumbing take the app down.
        console.warn("[useShieldDeepLink] failed to handle activation:", err);
      } finally {
        busy = false;
      }
    };

    // Cold start (the shield opened the app) ...
    void handleActive();

    // ... and every return to the foreground.
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void handleActive();
    });

    return () => subscription.remove();
  }, [hydrated, router]);
}
