import type { PropsWithChildren } from "react";
import { ActivityIndicator } from "react-native";

import { AnimatedPressable } from "../../animations/AnimatedPressable";
import { Text } from "../primitives";

interface PrimaryButtonProps extends PropsWithChildren {
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

export function PrimaryButton({
  children,
  disabled,
  loading,
  onPress,
}: PrimaryButtonProps) {
  return (
    <AnimatedPressable
      className={`min-h-12 items-center justify-center rounded-2xl px-5 py-3 ${
        disabled ? "bg-focuslab-border dark:bg-dark-border" : "bg-focuslab-primary"
      }`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : typeof children === "string" || typeof children === "number" ? (
        <Text className="text-base font-semibold text-white">{children}</Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}
