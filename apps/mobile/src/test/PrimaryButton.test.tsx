import {
  SPRING_DEFAULT,
  SPRING_SNAPPY,
  SPRING_GENTLE,
  SPRING_QUICK,
  SPRING_SQUISH,
} from "../animations/springs";

describe("PrimaryButton spring config", () => {
  it("uses SPRING_SNAPPY for release feedback (higher stiffness for responsiveness)", () => {
    expect(SPRING_SNAPPY.stiffness!).toBeGreaterThan(SPRING_DEFAULT.stiffness!);
    expect(SPRING_SNAPPY.damping!).toBeLessThan(SPRING_GENTLE.damping!);
  });

  it("uses SPRING_SQUISH for the dynamic-island-style press-in deformation", () => {
    expect(SPRING_SQUISH.stiffness!).toBeGreaterThan(SPRING_SNAPPY.stiffness!);
    expect(SPRING_SQUISH.mass!).toBeLessThan(SPRING_SNAPPY.mass!);
  });

  it("SPRING_QUICK is the stiffest config for immediate feedback", () => {
    expect(SPRING_QUICK.stiffness!).toBeGreaterThan(SPRING_SNAPPY.stiffness!);
  });
});
