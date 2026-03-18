import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "FocusLab",
  slug: "focuslab-mobile",
  scheme: "focuslab",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F0FFF4",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.focuslab.mobile",
  },
  android: {
    package: "app.focuslab.mobile",
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
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-notifications",
  ],
  extra: {
    appVariant: "development",
  },
};

export default config;
