import { Linking } from "react-native";

import { toNativeGatewayConfig } from "@focuslab/shared";

import {
  isFamilyControlsAvailable,
  syncGateway,
} from "../../modules/family-controls-bridge";
import type { GatewayStatus } from "../../modules/family-controls-bridge";
import { useGatewayStore } from "../stores/gatewayStore";

/**
 * Push the current settings to the native Screen Time layer, let it bring the
 * device in line (shields, expired sessions, usage monitor), and adopt the
 * state it reports back. This is the one place JS talks to native about
 * enforcement, so call it freely: on launch, on foreground, after the app
 * picker, and whenever a setting changes.
 */
export async function syncGatewayFromStore(): Promise<GatewayStatus | null> {
  if (!isFamilyControlsAvailable()) return null;

  try {
    const { applyNativeStatus, config } = useGatewayStore.getState();
    const status = await syncGateway(toNativeGatewayConfig(config));
    if (status) applyNativeStatus(status);
    return status;
  } catch (err) {
    console.warn("[gateway] sync failed:", err);
    return null;
  }
}

/**
 * URL schemes for apps people commonly pause, keyed by bundle id. iOS has no
 * public way to open an arbitrary app, so for anything not listed here the
 * breathing screen asks the user to swipe back instead.
 */
const URL_SCHEME_BY_BUNDLE_ID: Record<string, string> = {
  "com.atebits.Tweetie2": "twitter://",
  "com.burbn.barcelona": "barcelona://",
  "com.burbn.instagram": "instagram://",
  "com.facebook.Facebook": "fb://",
  "com.facebook.Messenger": "fb-messenger://",
  "com.google.ios.youtube": "youtube://",
  "com.hammerandchisel.discord": "discord://",
  "com.linkedin.LinkedIn": "linkedin://",
  "com.netflix.Netflix": "nflx://",
  "com.reddit.Reddit": "reddit://",
  "com.spotify.client": "spotify://",
  "com.toyopagroup.picaboo": "snapchat://",
  "com.tumblr.tumblr": "tumblr://",
  "com.zhiliaoapp.musically": "snssdk1233://",
  "net.whatsapp.WhatsApp": "whatsapp://",
  "ph.telegra.Telegraph": "tg://",
  pinterest: "pinterest://",
  "tv.twitch": "twitch://",
};

/** URL schemes for the app names used by the Shortcuts path (`?app=`). */
const URL_SCHEME_BY_APP_NAME: Record<string, string> = {
  facebook: "fb://",
  instagram: "instagram://",
  reddit: "reddit://",
  snapchat: "snapchat://",
  threads: "barcelona://",
  tiktok: "snssdk1233://",
  twitter: "twitter://",
  x: "twitter://",
  youtube: "youtube://",
};

export function urlSchemeForApp(options: {
  appName?: string | null;
  bundleId?: string | null;
}): string | null {
  if (options.bundleId && URL_SCHEME_BY_BUNDLE_ID[options.bundleId]) {
    return URL_SCHEME_BY_BUNDLE_ID[options.bundleId];
  }

  const name = options.appName?.trim().toLowerCase();
  if (name && URL_SCHEME_BY_APP_NAME[name]) {
    return URL_SCHEME_BY_APP_NAME[name];
  }

  return null;
}

/**
 * Try to switch to another app by URL scheme. Resolves false when the app
 * cannot be opened (not installed, or the scheme is wrong).
 *
 * This deliberately skips `Linking.canOpenURL`: on iOS that only answers
 * truthfully for schemes declared in LSApplicationQueriesSchemes, so it
 * reported "cannot open" for every app here.
 */
export async function openAppByScheme(scheme: string): Promise<boolean> {
  try {
    await Linking.openURL(scheme);
    return true;
  } catch {
    return false;
  }
}
