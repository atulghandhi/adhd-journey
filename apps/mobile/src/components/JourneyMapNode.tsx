import type { LayoutChangeEvent } from "react-native";
import { useColorScheme } from "nativewind";
import { Check, Circle, Clock, GripVertical, MessageCircle, Pen, Wind } from "lucide-react-native";
import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { REDUCED_MOTION_DURATION, SPRING_SNAPPY } from "../animations/springs";
import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Pressable, Text, View } from "./primitives";
import type { TaskRow } from "@focuslab/shared";

const INTERACTION_TYPE_ICONS: Partial<
  Record<TaskRow["interaction_type"], typeof Clock>
> = {
  breathing_exercise: Wind,
  community_prompt: MessageCircle,
  drag_list: GripVertical,
  journal: Pen,
  reflection_prompts: MessageCircle,
  timed_challenge: Clock,
};

interface JourneyMapNodeProps {
  canOpen: boolean;
  isActive: boolean;
  isCompleted: boolean;
  interactionType: TaskRow["interaction_type"];
  isLocked: boolean;
  justUnlocked: boolean;
  onActiveLayout?: (y: number) => void;
  onPress?: () => void;
  order: number;
  position: "left" | "right";
  subtitle: string | null;
  title: string;
}

export function JourneyMapNode({
  canOpen,
  isActive,
  isCompleted,
  interactionType,
  isLocked,
  justUnlocked,
  onActiveLayout,
  onPress,
  order,
  position,
  subtitle,
  title,
}: JourneyMapNodeProps) {
  const { colorScheme } = useColorScheme();
  const { lightImpact, mediumImpact } = useHaptics();
  const { reducedMotion } = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const nodeRotation = useSharedValue(0);
  const nodeScale = useSharedValue(1);
  const circleSize = isActive ? 36 : isCompleted ? 32 : 28;
  const textAlignClass = position === "right" ? "text-right" : "text-left";
  const TypeIcon = INTERACTION_TYPE_ICONS[interactionType];
  const shouldShowInteractionHint = Boolean(
    TypeIcon && !isLocked && (isCompleted || isActive),
  );
  const interactionHintColor = colorScheme === "dark" ? "#A5D6A7" : "#2D6A4F";

  useEffect(() => {
    if (!isActive || reducedMotion) {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0.5;
      return;
    }

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.45, { duration: 1000 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0.5;
    };
  }, [isActive, pulseOpacity, pulseScale, reducedMotion]);

  useEffect(() => {
    if (!isCompleted || reducedMotion) {
      cancelAnimation(nodeRotation);
      nodeRotation.value = 0;
      return;
    }

    nodeRotation.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 300 }),
        withTiming(2, { duration: 300 }),
        withTiming(0, { duration: 300 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(nodeRotation);
      nodeRotation.value = 0;
    };
  }, [isCompleted, nodeRotation, reducedMotion]);

  useEffect(() => {
    if (!justUnlocked) {
      nodeScale.value = 1;
      return;
    }

    mediumImpact();

    if (reducedMotion) {
      nodeScale.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
      return;
    }

    nodeScale.value = 0.85;
    nodeScale.value = withSpring(1, SPRING_SNAPPY);
  }, [justUnlocked, mediumImpact, nodeScale, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${nodeRotation.value}deg` },
      { scale: nodeScale.value },
    ],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    if (isActive && onActiveLayout) {
      onActiveLayout(event.nativeEvent.layout.y);
    }
  };

  return (
    <Pressable
      className="w-[52%]"
      disabled={!canOpen}
      onLayout={handleLayout}
      onPress={() => {
        if (!canOpen) {
          return;
        }

        lightImpact();
        onPress?.();
      }}
      style={{
        marginLeft: position === "left" ? "4%" : "44%",
      }}
    >
      <View
        className={`flex-row items-start gap-3 ${
          position === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <View className="items-center gap-1">
          <Animated.View
            className="items-center justify-center"
            style={[
              {
                height: circleSize,
                width: circleSize,
              },
              nodeStyle,
            ]}
          >
            {isActive ? (
              <Animated.View
                className="absolute rounded-full border-2 border-focuslab-primary"
                style={[
                  {
                    height: circleSize + 10,
                    width: circleSize + 10,
                  },
                  pulseStyle,
                ]}
              />
            ) : null}
            <View
              className={`items-center justify-center rounded-full border ${
                isCompleted
                  ? "border-focuslab-primary bg-focuslab-primary"
                  : isActive
                    ? "border-focuslab-primary bg-white dark:bg-dark-surface"
                    : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-surface"
              }`}
              style={{
                height: circleSize,
                width: circleSize,
              }}
            >
              {isCompleted ? (
                <Check color="#FFFFFF" size={16} />
              ) : isLocked ? (
                <View className="h-3 w-3 rounded-full border border-dashed border-focuslab-border dark:border-dark-border" />
              ) : (
                <Circle color="#40916C" fill="#40916C" size={14} />
              )}
            </View>
          </Animated.View>
          {shouldShowInteractionHint && TypeIcon ? (
            <TypeIcon color={interactionHintColor} size={12} />
          ) : null}
        </View>

        <View className={`flex-1 ${position === "right" ? "items-end" : ""}`}>
          <Text
            className={`text-xs font-medium uppercase tracking-[1.6px] text-focuslab-secondary dark:text-dark-text-secondary ${textAlignClass}`}
          >
            Day {order}
          </Text>
          <Text
            className={`mt-1 text-base font-semibold ${
              isLocked
                ? "text-focuslab-border dark:text-dark-border"
                : "text-focuslab-primaryDark dark:text-dark-text-primary"
            } ${textAlignClass}`}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className={`mt-1 text-sm text-gray-500 dark:text-dark-text-secondary ${textAlignClass}`}
            >
              {subtitle}
            </Text>
          ) : null}
          {isActive && !isCompleted ? (
            <View className="mt-2 rounded-full bg-focuslab-primary px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">START</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
