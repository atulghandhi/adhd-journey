import {
  SPRING_DEFAULT,
  SPRING_SNAPPY,
  SPRING_GENTLE,
  SPRING_QUICK,
} from "../animations/springs";

describe("PrimaryButton spring config", () => {
  it("uses SPRING_SNAPPY for press feedback (higher stiffness for responsiveness)", () => {
    expect(SPRING_SNAPPY.stiffness!).toBeGreaterThan(SPRING_DEFAULT.stiffness!);
    expect(SPRING_SNAPPY.damping!).toBeLessThan(SPRING_GENTLE.damping!);
  });

  it("SPRING_QUICK is the stiffest config for immediate feedback", () => {
    expect(SPRING_QUICK.stiffness!).toBeGreaterThan(SPRING_SNAPPY.stiffness!);
  });
});
