import type { ReactNode } from "react";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  Stack: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  return {
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: "Animated.View",
    createAnimatedComponent: (c: unknown) => c,
  },
  Easing: { ease: jest.fn(), inOut: () => jest.fn() },
  useAnimatedStyle: () => ({}),
  useSharedValue: (v: unknown) => ({ value: v }),
  withDelay: (_d: number, v: unknown) => v,
  withRepeat: (v: unknown) => v,
  withSequence: (...args: unknown[]) => args[0],
  withSpring: (v: unknown) => v,
  withTiming: (v: unknown) => v,
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Error: "error", Success: "success" },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock("nativewind", () => ({
  useColorScheme: () => ({ colorScheme: "light", setColorScheme: jest.fn() }),
}));

jest.mock("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo", () => ({
  addEventListener: () => ({ remove: jest.fn() }),
  isReduceMotionEnabled: () => Promise.resolve(false),
}));
