import type { ReactNode } from "react";

jest.mock("expo-router", () => ({
  Stack: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => {
  return {
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});
