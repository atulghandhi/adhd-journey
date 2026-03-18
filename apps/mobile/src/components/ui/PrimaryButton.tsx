import type { PropsWithChildren } from "react";
import { ActivityIndicator } from "react-native";

import { Pressable, Text } from "../primitives";

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
    <Pressable
      className={`min-h-12 items-center justify-center rounded-2xl px-5 py-3 ${
        disabled ? "bg-focuslab-border" : "bg-focuslab-primary"
      }`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="font-semibold text-base text-white">{children}</Text>
      )}
    </Pressable>
  );
}
