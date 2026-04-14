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

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    mergeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("./modules/widget-data-bridge", () => ({
  setWidgetData: jest.fn(() => true),
  clearWidgetData: jest.fn(() => true),
}));

jest.mock("./modules/family-controls-bridge", () => ({
  isFamilyControlsAvailable: jest.fn(() => false),
  requestFamilyControlsAuth: jest.fn(() => Promise.resolve(false)),
  getFamilyControlsStatus: jest.fn(() => Promise.resolve("notDetermined")),
  presentAppPicker: jest.fn(() => Promise.resolve(false)),
  applyShields: jest.fn(() => Promise.resolve(false)),
  removeShields: jest.fn(() => Promise.resolve(false)),
  removeShieldsTemporarily: jest.fn(() => Promise.resolve(false)),
  startDoomScrollMonitor: jest.fn(() => Promise.resolve(false)),
  stopDoomScrollMonitor: jest.fn(() => Promise.resolve(false)),
  writeSharedGatewayData: jest.fn(() => Promise.resolve(false)),
}));

