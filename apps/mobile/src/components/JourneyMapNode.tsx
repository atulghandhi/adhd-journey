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
  const circleSize = isActive ? 48 : isCompleted ? 40 : 36;
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
      className="w-[56%]"
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
        marginLeft: position === "left" ? "2%" : "42%",
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
              className={`items-center justify-center rounded-full ${
                isCompleted
                  ? "border-2 border-focuslab-primary bg-focuslab-primary"
                  : isActive
                    ? "border-2 border-focuslab-primary bg-white dark:bg-dark-surface"
                    : "border border-focuslab-border bg-focuslab-background dark:border-dark-border dark:bg-dark-bg"
              }`}
              style={[
                {
                  height: circleSize,
                  width: circleSize,
                },
                (isCompleted || isActive) && {
                  elevation: 4,
                  shadowColor: "#40916C",
                  shadowOffset: { height: 2, width: 0 },
                  shadowOpacity: isActive ? 0.3 : 0.15,
                  shadowRadius: isActive ? 8 : 4,
                },
              ]}
            >
              {isCompleted ? (
                <Check color="#FFFFFF" size={18} />
              ) : isLocked ? (
                <Circle color="#D8F3DC" fill="#D8F3DC" size={12} />
              ) : (
                <Circle color="#40916C" fill="#40916C" size={16} />
              )}
            </View>
          </Animated.View>
          {shouldShowInteractionHint && TypeIcon ? (
            <TypeIcon color={interactionHintColor} size={12} />
          ) : null}
        </View>

        <View className={`flex-1 ${position === "right" ? "items-end" : ""}`}>
          <View
            className={`self-start rounded-full px-2 py-0.5 ${
              isActive
                ? "bg-focuslab-primary"
                : isCompleted
                  ? "bg-focuslab-background dark:bg-dark-bg"
                  : "bg-focuslab-border dark:bg-dark-border"
            } ${position === "right" ? "self-end" : ""}`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isActive ? "text-white" : "text-focuslab-secondary dark:text-dark-text-secondary"
              }`}
            >
              {isActive ? "START · " : ""}DAY {order}
            </Text>
          </View>
          <Text
            className={`mt-1.5 text-base font-semibold leading-5 ${
              isLocked
                ? "text-focuslab-border dark:text-dark-border"
                : "text-focuslab-primaryDark dark:text-dark-text-primary"
            } ${textAlignClass}`}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className={`mt-1 text-xs text-focuslab-secondary dark:text-dark-text-secondary ${textAlignClass}`}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
