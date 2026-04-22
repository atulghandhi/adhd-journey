import "../global.css";

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { AppProviders } from "../src/providers/AppProviders";
import { BootstrapScreen } from "../src/screens/BootstrapScreen";
import {
  applyShields,
  isFamilyControlsAvailable,
  getFamilyControlsStatus,
} from "../modules/family-controls-bridge";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Re-apply shields on cold launch so the user's selection survives
  // app restarts. ManagedSettings persists across launches, but the
  // explicit apply is a safety net if anything cleared the store.
  useEffect(() => {
    if (!isFamilyControlsAvailable()) return;
    void getFamilyControlsStatus().then((status) => {
      if (status === "authorized") {
        void applyShields();
      }
    });
  }, []);

  if (!fontsLoaded) {
    return <BootstrapScreen />;
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: "#F0FFF4",
            },
            headerShown: false,
          }}
        />
      </AppProviders>
    </ErrorBoundary>
  );
}
