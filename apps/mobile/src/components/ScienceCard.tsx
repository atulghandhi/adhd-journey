import { useCallback, useMemo, useRef } from "react";
import { Dimensions, PanResponder, Platform, StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  REDUCED_MOTION_DURATION,
  SPRING_GENTLE,
} from "../animations/springs";
import { useHaptics } from "../hooks/useHaptics";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { MarkdownBlock } from "./MarkdownBlock";
import { Text, View } from "./primitives";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 80;
const EXPANDED_TOP_INSET = 100;
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY = 0.4;

interface ScienceCardProps {
  content: string | null | undefined;
}

export function ScienceCard({ content }: ScienceCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { reducedMotion } = useReducedMotion();
  const { lightImpact, selectionChanged } = useHaptics();
  const expanded = useRef(false);
  const hasStartedDrag = useRef(false);
  const translateY = useSharedValue(0);
  const maxSlide = SCREEN_HEIGHT - EXPANDED_TOP_INSET - COLLAPSED_HEIGHT;

  const animate = useCallback(
    (toValue: number) => {
      if (reducedMotion) {
        translateY.value = withTiming(toValue, {
          duration: REDUCED_MOTION_DURATION,
        });
      } else {
        translateY.value = withSpring(toValue, SPRING_GENTLE);
      }
    },
    [reducedMotion, translateY],
  );

  const toggle = useCallback(
    (open: boolean) => {
      const wasExpanded = expanded.current;
      expanded.current = open;
      animate(open ? -maxSlide : 0);
      if (open !== wasExpanded) {
        lightImpact();
      }
    },
    [animate, lightImpact, maxSlide],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          hasStartedDrag.current = false;
        },
        onPanResponderMove: (_e, g) => {
          if (!hasStartedDrag.current && Math.abs(g.dy) > 4) {
            hasStartedDrag.current = true;
            selectionChanged();
          }
          const base = expanded.current ? -maxSlide : 0;
          const next = Math.min(0, Math.max(-maxSlide, base + g.dy));
          translateY.value = next;
        },
        onPanResponderRelease: (_e, g) => {
          if (
            (!expanded.current && g.dy < -SWIPE_THRESHOLD) ||
            (!expanded.current && g.vy < -SWIPE_VELOCITY)
          ) {
            toggle(true);
          } else if (
            (expanded.current && g.dy > SWIPE_THRESHOLD) ||
            (expanded.current && g.vy > SWIPE_VELOCITY)
          ) {
            toggle(false);
          } else {
            toggle(expanded.current);
          }
        },
      }),
    [maxSlide, selectionChanged, toggle, translateY],
  );

  const progress = useMemo(() => [-maxSlide, 0], [maxSlide]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    ...(Platform.OS === "ios"
      ? {
          shadowOpacity: interpolate(
            translateY.value,
            progress,
            [0.28, 0.12],
          ),
          shadowRadius: interpolate(translateY.value, progress, [24, 12]),
        }
      : {
          elevation: interpolate(translateY.value, progress, [24, 12]),
        }),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(translateY.value, progress, [180, 0])}deg`,
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, progress, [0.35, 0]),
  }));

  if (!content || content === "The science behind this task will be added here.") {
    return null;
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, backdropStyle]}
      />
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#1A2E23" : "#FFFFFF" },
          sheetStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <View className="items-center pb-1 pt-3">
          <View className="h-1.5 w-10 rounded-full bg-focuslab-border dark:bg-dark-border" />
        </View>
        <View style={styles.header}>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
              The science behind this
            </Text>
            <Animated.Text
              style={[
                styles.chevron,
                { color: isDark ? "#7EB09B" : "#4B5563" },
                chevronStyle,
              ]}
            >
              ▲
            </Animated.Text>
          </View>
          <Text className="mt-1 text-xs text-focuslab-secondary dark:text-dark-text-secondary">
            Swipe up to read
          </Text>
        </View>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <MarkdownBlock content={content} />
        </Animated.ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  chevron: {
    fontSize: 14,
  },
  container: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    bottom: 0,
    elevation: 12,
    left: 0,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    top: SCREEN_HEIGHT - COLLAPSED_HEIGHT,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
});
