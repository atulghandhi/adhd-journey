import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Switch,
  Pressable as RNPressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { CompletionCheckInInput } from "@focuslab/shared";

import { REDUCED_MOTION_DURATION, SPRING_GENTLE } from "../../animations/springs";
import { EmojiRating } from "../../components/EmojiRating";
import {
  ScrollView,
  Text,
  TextInput,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const SHEET_HIDDEN_OFFSET = Math.round(Dimensions.get("window").height * 0.82);
const SHEET_CLOSE_DURATION = 240;
const SHEET_CLOSE_THRESHOLD = 120;
const SHEET_CLOSE_VELOCITY = 0.8;

interface CheckInSheetProps {
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: CompletionCheckInInput) => Promise<void>;
  visible: boolean;
}

export function CheckInSheet({
  loading,
  onClose,
  onSubmit,
  visible,
}: CheckInSheetProps) {
  const { reducedMotion } = useReducedMotion();
  const [quickRating, setQuickRating] = useState<number | null>(null);
  const [triedIt, setTriedIt] = useState(true);
  const [whatHappened, setWhatHappened] = useState("");
  const [whatWasHard, setWhatWasHard] = useState("");
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

  const requestClose = useCallback((velocity = 0) => {
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
  }, [backdropOpacity, clearDismissTimer, isClosing, onClose, reducedMotion, translateY]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [openSheet, visible]);

  useEffect(() => () => {
    clearDismissTimer();
  }, [clearDismissTimer]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_event, gestureState) => {
          const nextTranslateY = Math.max(0, gestureState.dy);
          translateY.value = nextTranslateY;
          backdropOpacity.value = Math.max(0, 1 - nextTranslateY / SHEET_HIDDEN_OFFSET);
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

  const handleSubmit = async () => {
    if (!quickRating) {
      return;
    }

    await onSubmit({
      checkedInAt: new Date().toISOString(),
      promptResponses: {
        what_happened: whatHappened,
        what_was_hard: whatWasHard,
      },
      quickRating,
      timeSpentSeconds: 0,
      triedIt,
    });
    requestClose();
    setQuickRating(null);
    setTriedIt(true);
    setWhatHappened("");
    setWhatWasHard("");
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ maxHeight: "80%" }}
        >
        <Animated.View
          className="rounded-t-[30px] bg-white px-6 pb-6 dark:bg-dark-surface"
          style={[sheetAnimatedStyle, { maxHeight: "100%" }]}
        >
          <View
            className="items-center pb-3 pt-3"
            {...panResponder.panHandlers}
          >
            <View className="h-1.5 w-12 rounded-full bg-focuslab-border dark:bg-dark-border" />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              Quick check-in
            </Text>
            <Text className="mt-2 text-base leading-6 text-focuslab-secondary dark:text-dark-text-secondary">
              This should take less than 10 seconds unless you want to add more detail.
            </Text>

            <View className="mt-6 gap-4">
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                How did it feel?
              </Text>
              <EmojiRating onChange={setQuickRating} value={quickRating} />
            </View>

            <View className="mt-6 flex-row items-center justify-between rounded-2xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                  Did you try it?
                </Text>
                <Text className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
                  A quick yes or no helps the algorithm decide whether to extend the task.
                </Text>
              </View>
              <Switch onValueChange={setTriedIt} value={triedIt} />
            </View>

            <View className="mt-6 gap-3">
              <Text className="text-base font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
                Optional deeper reflection
              </Text>
              <TextInput
                className="min-h-24 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base leading-7 text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
                multiline
                onChangeText={setWhatHappened}
                placeholder="What happened?"
                textAlignVertical="top"
                value={whatHappened}
              />
              <TextInput
                className="min-h-24 rounded-2xl border border-focuslab-border bg-focuslab-background px-4 py-3 text-base leading-7 text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
                multiline
                onChangeText={setWhatWasHard}
                placeholder="What was hard?"
                textAlignVertical="top"
                value={whatWasHard}
              />
            </View>

            <View className="mt-8">
              <PrimaryButton
                disabled={!quickRating}
                loading={loading}
                onPress={() => {
                  void handleSubmit();
                }}
              >
                Save check-in
              </PrimaryButton>
            </View>
          </ScrollView>
        </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
