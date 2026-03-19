import type { WithSpringConfig } from "react-native-reanimated";

export const SPRING_DEFAULT: WithSpringConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
};

export const SPRING_SNAPPY: WithSpringConfig = {
  damping: 12,
  mass: 1,
  stiffness: 200,
};

export const SPRING_GENTLE: WithSpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 80,
};

export const SPRING_QUICK: WithSpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 300,
};

export const SPRING_SQUISH: WithSpringConfig = {
  damping: 10,
  mass: 0.8,
  stiffness: 250,
};

export const REDUCED_MOTION_DURATION = 150;
