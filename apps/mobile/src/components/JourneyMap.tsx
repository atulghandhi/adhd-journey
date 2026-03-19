import { Lock, Check, Circle } from "lucide-react-native";
import { Pressable, Text, View } from "./primitives";

import type { JourneyState } from "@focuslab/shared";

interface JourneyMapProps {
  onSelectTask?: (taskId: string) => void;
  state: JourneyState;
}

export function JourneyMap({ onSelectTask, state }: JourneyMapProps) {
  return (
    <View className="gap-4">
      {state.tasks.map((item) => (
        <Pressable
          className="flex-row items-start gap-3"
          disabled={!item.canOpen}
          key={item.task.id}
          onPress={() => onSelectTask?.(item.task.id)}
        >
          <View className="items-center">
            <View
              className={`h-7 w-7 items-center justify-center rounded-full border ${
                item.isCompleted
                  ? "border-focuslab-primary bg-focuslab-primary"
                  : item.isActive
                    ? "border-focuslab-primary bg-white dark:bg-dark-surface"
                    : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-surface"
              }`}
            >
              {item.isCompleted ? (
                <Check color="#FFFFFF" size={14} />
              ) : item.isLocked ? (
                <Lock color="#6B7280" size={12} />
              ) : (
                <Circle color="#40916C" fill="#40916C" size={12} />
              )}
            </View>
            <View
              className={`mt-2 h-10 w-px ${
                item.task.order === state.tasks[state.tasks.length - 1]?.task.order
                  ? "bg-transparent"
                  : item.isCompleted
                    ? "bg-focuslab-primary"
                    : "bg-focuslab-border"
              }`}
            />
          </View>
          <View className="flex-1 pb-4">
            <Text className="text-xs font-medium uppercase tracking-[1.6px] text-focuslab-secondary dark:text-dark-text-secondary">
              Day {item.task.order}
            </Text>
            <Text
              className={`mt-1 text-base font-semibold ${
                item.isLocked ? "text-gray-400 dark:text-gray-600" : "text-focuslab-primaryDark dark:text-dark-text-primary"
              }`}
            >
              {item.task.title}
            </Text>
            {item.subtitle ? (
              <Text className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">{item.subtitle}</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
