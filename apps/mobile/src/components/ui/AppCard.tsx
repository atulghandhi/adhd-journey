import type { PropsWithChildren } from "react";
import { View } from "../primitives";

export function AppCard({ children }: PropsWithChildren) {
  return (
    <View className="rounded-[22px] bg-white p-5 shadow-sm shadow-black/10 dark:border dark:border-dark-border dark:bg-dark-surface dark:shadow-none">
      {children}
    </View>
  );
}
