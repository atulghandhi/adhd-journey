import { GripVertical, ArrowDown, ArrowUp, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";

import { AnimatedCardEntrance } from "../../animations/AnimatedCardEntrance";
import { useHaptics } from "../../hooks/useHaptics";
import { Pressable, Text, TextInput, View } from "../primitives";
import {
  isDragListComplete,
  normalizeDragListConfig,
} from "./taskUtils";
import type { InteractiveTaskProps } from "./types";

export function DragListTask({
  config,
  onCompletionChange,
}: InteractiveTaskProps) {
  const dragListConfig = normalizeDragListConfig(config);
  const { lightImpact, selectionChanged } = useHaptics();
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const complete = isDragListComplete(items, dragListConfig.minItems);

  useEffect(() => {
    onCompletionChange(complete, complete ? { items } : undefined);
  }, [complete, items, onCompletionChange]);

  const handleAdd = () => {
    const nextItem = draft.trim();

    if (!nextItem || items.length >= dragListConfig.maxItems) {
      return;
    }

    selectionChanged();
    setItems((current) => [...current, nextItem]);
    setDraft("");
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    selectionChanged();
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);

      if (!item) {
        return current;
      }

      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const removeItem = (index: number) => {
    lightImpact();
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <View>
      <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
        {dragListConfig.instruction}
      </Text>

      <View className="mt-4 gap-3">
        {items.map((item, index) => (
          <AnimatedCardEntrance delay={index * 40} key={`${item}-${index}`}>
            <View className="flex-row items-center gap-3 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
              <GripVertical color="#40916C" size={18} />
              <Text className="flex-1 text-base text-focuslab-primaryDark dark:text-dark-text-primary">
                {item}
              </Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="rounded-full p-2"
                  disabled={index === 0}
                  onPress={() => moveItem(index, -1)}
                >
                  <ArrowUp color={index === 0 ? "#B7E4C7" : "#40916C"} size={16} />
                </Pressable>
                <Pressable
                  className="rounded-full p-2"
                  disabled={index === items.length - 1}
                  onPress={() => moveItem(index, 1)}
                >
                  <ArrowDown
                    color={index === items.length - 1 ? "#B7E4C7" : "#40916C"}
                    size={16}
                  />
                </Pressable>
                <Pressable className="rounded-full p-2" onPress={() => removeItem(index)}>
                  <X color="#6B7280" size={16} />
                </Pressable>
              </View>
            </View>
          </AnimatedCardEntrance>
        ))}
      </View>

      <View className="mt-4 flex-row gap-3">
        <TextInput
          className="flex-1 min-h-12 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
          onChangeText={setDraft}
          placeholder={dragListConfig.placeholder}
          value={draft}
        />
        <Pressable
          className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 ${
            items.length >= dragListConfig.maxItems
              ? "bg-focuslab-border dark:bg-dark-border"
              : "bg-focuslab-primary"
          }`}
          disabled={items.length >= dragListConfig.maxItems}
          onPress={handleAdd}
        >
          <Plus color="#FFFFFF" size={16} />
          <Text className="text-base font-semibold text-white">Add</Text>
        </Pressable>
      </View>

      <Text className="mt-3 text-sm text-focuslab-secondary dark:text-dark-text-secondary">
        {items.length}/{dragListConfig.minItems} minimum
      </Text>
    </View>
  );
}
