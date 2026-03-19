import type { PropsWithChildren } from "react";

import { SafeAreaView, Text, View } from "./primitives";

interface AuthScaffoldProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthScaffold({ children, subtitle, title }: AuthScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <View className="flex-1 px-6 py-8">
        <View className="mb-6 gap-3">
          <Text className="text-[32px] font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            {title}
          </Text>
          <Text className="text-base leading-[26px] text-focuslab-secondary dark:text-dark-text-secondary">
            {subtitle}
          </Text>
        </View>
        <View className="gap-4 rounded-3xl bg-white p-6 shadow-sm shadow-black/10 dark:border dark:border-dark-border dark:bg-dark-surface dark:shadow-none">
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}
