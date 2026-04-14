import { useCallback, useMemo, useRef } from "react";
import { Dimensions, PanResponder, StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { SPRING_GENTLE } from "../animations/springs";
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
  const expanded = useRef(false);
  const translateY = useSharedValue(0);
  const maxSlide = SCREEN_HEIGHT - EXPANDED_TOP_INSET - COLLAPSED_HEIGHT;

  const toggle = useCallback(
    (open: boolean) => {
      expanded.current = open;
      translateY.value = withSpring(open ? -maxSlide : 0, SPRING_GENTLE);
    },
    [maxSlide, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
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
    [maxSlide, toggle, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!content || content === "The science behind this task will be added here.") {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1A2E23" : "#FFFFFF" },
        animatedStyle,
      ]}
      {...panResponder.panHandlers}
    >
      <View className="items-center pb-2 pt-3">
        <View className="h-1.5 w-10 rounded-full bg-focuslab-border dark:bg-dark-border" />
      </View>
      <View style={styles.header}>
        <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
          The science behind this
        </Text>
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
  );
}

const styles = StyleSheet.create({
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
