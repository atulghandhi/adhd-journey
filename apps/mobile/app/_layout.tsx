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

import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { AppProviders } from "../src/providers/AppProviders";
import { BootstrapScreen } from "../src/screens/BootstrapScreen";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

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
