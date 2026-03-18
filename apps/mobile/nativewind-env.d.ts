/// <reference types="nativewind/types" />

import "react-native";
import "react-native-safe-area-context";

declare module "react-native" {
  interface ActivityIndicatorProps {
    className?: string;
  }

  interface ImageProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface ViewProps {
    className?: string;
  }
}

declare module "react-native-safe-area-context" {
  interface SafeAreaViewProps {
    className?: string;
  }
}
