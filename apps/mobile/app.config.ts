import type { ExpoConfig } from "expo/config";

const BUNDLE_ID = "app.nextthing.mobile";
const APP_GROUP = "group.app.nextthing";

// EAS Build creates signing credentials before the native project exists, so
// it has to be told about every extension target the config plugins add.
// Keep in step with plugins/withFamilyControls and plugins/withTodayTaskWidget.
const SCREEN_TIME_ENTITLEMENTS = {
  "com.apple.developer.family-controls": true,
  "com.apple.security.application-groups": [APP_GROUP],
};
const APP_EXTENSIONS = [
  {
    targetName: "ShieldConfigExtension",
    bundleIdentifier: `${BUNDLE_ID}.ShieldConfig`,
    entitlements: SCREEN_TIME_ENTITLEMENTS,
  },
  {
    targetName: "ShieldActionExtension",
    bundleIdentifier: `${BUNDLE_ID}.ShieldAction`,
    entitlements: SCREEN_TIME_ENTITLEMENTS,
  },
  {
    targetName: "DeviceActivityMonitorExtension",
    bundleIdentifier: `${BUNDLE_ID}.DeviceActivityMonitor`,
    entitlements: SCREEN_TIME_ENTITLEMENTS,
  },
  {
    targetName: "TodayTaskWidget",
    bundleIdentifier: `${BUNDLE_ID}.TodayTaskWidget`,
    entitlements: { "com.apple.security.application-groups": [APP_GROUP] },
  },
];

const config: ExpoConfig = {
  name: "Next Thing",
  slug: "next-thing-mobile",
  scheme: "nextthing",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F0FFF4",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
  },
  android: {
    package: "app.nextthing.mobile",
    adaptiveIcon: {
      backgroundColor: "#D8F3DC",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-notifications",
    "./plugins/withTodayTaskWidget/withTodayTaskWidget",
    "./plugins/withFamilyControls/withFamilyControls",
  ],
  extra: {
    appVariant: "development",
    eas: {
      build: {
        experimental: {
          ios: {
            appExtensions: APP_EXTENSIONS,
          },
        },
      },
      projectId: process.env.EAS_PROJECT_ID ?? "REPLACE_WITH_EAS_PROJECT_ID",
    },
  },
};

export default config;
