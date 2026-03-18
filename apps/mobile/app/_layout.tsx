import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../src/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: "#F0FFF4",
          },
          headerShown: false,
        }}
      />
    </AppProviders>
  );
}
