import type { PropsWithChildren } from "react";
import { Platform } from "react-native";

import { Text } from "../primitives";

const emojiFontFamily = Platform.select({
  ios: "Apple Color Emoji",
  default: undefined,
});

interface EmojiTextProps extends PropsWithChildren {
  size?: number;
}

export function EmojiText({ children, size = 20 }: EmojiTextProps) {
  return (
    <Text
      style={{
        fontFamily: emojiFontFamily,
        fontSize: size,
      }}
    >
      {children}
    </Text>
  );
}
