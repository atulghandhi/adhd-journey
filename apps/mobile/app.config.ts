import type { ExpoConfig } from "expo/config";

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
    bundleIdentifier: "app.nextthing.mobile",
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
  ],
  extra: {
    appVariant: "development",
  },
};

export default config;
