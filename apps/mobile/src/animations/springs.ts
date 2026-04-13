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

export const SPRING_MAGNETIC: WithSpringConfig = {
  damping: 8,
  mass: 1.2,
  stiffness: 120,
};

export const SPRING_FLUID: WithSpringConfig = {
  damping: 14,
  mass: 1.4,
  stiffness: 100,
};

export const SPRING_BOUNCE: WithSpringConfig = {
  damping: 6,
  mass: 0.9,
  stiffness: 180,
};

export const REDUCED_MOTION_DURATION = 150;
