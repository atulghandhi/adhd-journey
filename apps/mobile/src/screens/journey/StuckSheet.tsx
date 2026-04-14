import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable as RNPressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { SkipReason } from "@focuslab/shared";

import { REDUCED_MOTION_DURATION, SPRING_GENTLE } from "../../animations/springs";
import { AnimatedPressable } from "../../animations/AnimatedPressable";
import {
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const SHEET_HIDDEN_OFFSET = Math.round(Dimensions.get("window").height * 0.82);
const SHEET_CLOSE_DURATION = 240;
const SHEET_CLOSE_THRESHOLD = 120;
const SHEET_CLOSE_VELOCITY = 0.8;

const STUCK_OPTIONS: { label: string; nudge: string; value: SkipReason }[] = [
  {
    label: "Too hard right now",
    nudge: "Try just the first step. You can stop after that.",
    value: "too_hard",
  },
  {
    label: "Doesn't apply to me",
    nudge: "That's fine. Skip it, no guilt.",
    value: "not_relevant",
  },
  {
    label: "I don't understand it",
    nudge: "Check the 'Why this matters' section below the task for more context.",
    value: "dont_understand",
  },
  {
    label: "Not in the mood today",
    nudge: "That's okay. Come back later, or skip to tomorrow.",
    value: "not_in_mood",
  },
];

interface StuckSheetProps {
  loading?: boolean;
  onClose: () => void;
  onSkip: (reason: SkipReason) => Promise<void>;
  visible: boolean;
}

export function StuckSheet({
  loading,
  onClose,
  onSkip,
  visible,
}: StuckSheetProps) {
  const { reducedMotion } = useReducedMotion();
  const [selectedReason, setSelectedReason] = useState<SkipReason | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(SHEET_HIDDEN_OFFSET);
  const shouldRender = visible || isClosing;

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const openSheet = useCallback(() => {
    clearDismissTimer();
    setIsClosing(false);
    translateY.value = SHEET_HIDDEN_OFFSET;
    backdropOpacity.value = 0;

    if (reducedMotion) {
      translateY.value = withTiming(0, { duration: REDUCED_MOTION_DURATION });
      backdropOpacity.value = withTiming(1, { duration: REDUCED_MOTION_DURATION });
    } else {
      translateY.value = withSpring(0, SPRING_GENTLE);
      backdropOpacity.value = withTiming(1, { duration: 180 });
    }
  }, [backdropOpacity, clearDismissTimer, reducedMotion, translateY]);

  const requestClose = useCallback(
    (velocity = 0) => {
      if (isClosing) {
        return;
      }

      clearDismissTimer();
      setIsClosing(true);

      if (reducedMotion) {
        translateY.value = withTiming(SHEET_HIDDEN_OFFSET, {
          duration: REDUCED_MOTION_DURATION,
        });
        backdropOpacity.value = withTiming(0, {
          duration: REDUCED_MOTION_DURATION,
        });
      } else {
        translateY.value = withSpring(SHEET_HIDDEN_OFFSET, {
          ...SPRING_GENTLE,
          velocity,
        });
        backdropOpacity.value = withTiming(0, { duration: 180 });
      }

      dismissTimer.current = setTimeout(() => {
        dismissTimer.current = null;
        setIsClosing(false);
        onClose();
      }, reducedMotion ? REDUCED_MOTION_DURATION : SHEET_CLOSE_DURATION);
    },
    [backdropOpacity, clearDismissTimer, isClosing, onClose, reducedMotion, translateY],
  );

  useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      openSheet();
    }
  }, [openSheet, visible]);

  useEffect(
    () => () => {
      clearDismissTimer();
    },
    [clearDismissTimer],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_event, gestureState) => {
          const nextTranslateY = Math.max(0, gestureState.dy);
          translateY.value = nextTranslateY;
          backdropOpacity.value = Math.max(
            0,
            1 - nextTranslateY / SHEET_HIDDEN_OFFSET,
          );
        },
        onPanResponderRelease: (_event, gestureState) => {
          const nextVelocity = Math.max(gestureState.vy * SHEET_HIDDEN_OFFSET, 0);

          if (
            gestureState.dy > SHEET_CLOSE_THRESHOLD ||
            gestureState.vy > SHEET_CLOSE_VELOCITY
          ) {
            requestClose(nextVelocity);
            return;
          }

          if (reducedMotion) {
            translateY.value = withTiming(0, { duration: REDUCED_MOTION_DURATION });
            backdropOpacity.value = withTiming(1, {
              duration: REDUCED_MOTION_DURATION,
            });
          } else {
            translateY.value = withSpring(0, {
              ...SPRING_GENTLE,
              velocity: nextVelocity,
            });
            backdropOpacity.value = withTiming(1, { duration: 180 });
          }
        },
        onPanResponderTerminate: (_event, gestureState) => {
          const nextVelocity = Math.max(gestureState.vy * SHEET_HIDDEN_OFFSET, 0);

          if (reducedMotion) {
            translateY.value = withTiming(0, { duration: REDUCED_MOTION_DURATION });
            backdropOpacity.value = withTiming(1, {
              duration: REDUCED_MOTION_DURATION,
            });
          } else {
            translateY.value = withSpring(0, {
              ...SPRING_GENTLE,
              velocity: nextVelocity,
            });
            backdropOpacity.value = withTiming(1, { duration: 180 });
          }
        },
      }),
    [backdropOpacity, reducedMotion, requestClose, translateY],
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const selectedOption = STUCK_OPTIONS.find((opt) => opt.value === selectedReason);

  const handleSkip = async () => {
    if (!selectedReason) {
      return;
    }

    await onSkip(selectedReason);
    requestClose();
    setSelectedReason(null);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Modal onRequestClose={() => requestClose()} transparent visible>
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0 bg-black/30"
          pointerEvents="none"
          style={backdropAnimatedStyle}
        />
        <RNPressable
          onPress={() => requestClose()}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          className="max-h-[80%] rounded-t-[30px] bg-white px-6 pb-6 dark:bg-dark-surface"
          style={sheetAnimatedStyle}
        >
          <View
            className="items-center pb-3 pt-3"
            {...panResponder.panHandlers}
          >
            <View className="h-1.5 w-12 rounded-full bg-focuslab-border dark:bg-dark-border" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              What's getting in the way?
            </Text>
            <Text className="mt-2 text-base leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
              No judgment. Understanding what's blocking you helps us help you.
            </Text>

            <View className="mt-6 gap-3">
              {STUCK_OPTIONS.map((option) => (
                <AnimatedPressable
                  key={option.value}
                  onPress={() => setSelectedReason(option.value)}
                >
                  <View
                    className={`rounded-2xl border px-4 py-3.5 ${
                      selectedReason === option.value
                        ? "border-focuslab-primary bg-focuslab-background dark:border-focuslab-primary dark:bg-dark-bg"
                        : "border-focuslab-border bg-white dark:border-dark-border dark:bg-dark-surface"
                    }`}
                  >
                    <Text
                      className={`text-base font-medium ${
                        selectedReason === option.value
                          ? "text-focuslab-primary"
                          : "text-focuslab-primaryDark dark:text-dark-text-primary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </View>

            {selectedOption ? (
              <View className="mt-5 rounded-2xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg">
                <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                  {selectedOption.nudge}
                </Text>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              {selectedReason ? (
                <PrimaryButton
                  loading={loading}
                  onPress={() => {
                    void handleSkip();
                  }}
                >
                  Skip to tomorrow's task
                </PrimaryButton>
              ) : null}
              <AnimatedPressable onPress={() => requestClose()}>
                <View className="items-center rounded-[14px] py-3">
                  <Text className="text-base font-semibold text-focuslab-secondary dark:text-dark-text-secondary">
                    Never mind, I'll try it
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
