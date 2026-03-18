import type { PropsWithChildren } from "react";
import { View } from "../primitives";

export function AppCard({ children }: PropsWithChildren) {
  return (
    <View className="rounded-[22px] bg-white p-5 shadow-sm shadow-black/10">
      {children}
    </View>
  );
}
