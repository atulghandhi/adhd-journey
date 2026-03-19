import {
  REDUCED_MOTION_DURATION,
  SPRING_DEFAULT,
  SPRING_GENTLE,
  SPRING_QUICK,
  SPRING_SQUISH,
  SPRING_SNAPPY,
} from "../animations/springs";

describe("spring animation configs", () => {
  it("exports five spring presets with required fields", () => {
    for (const spring of [
      SPRING_DEFAULT,
      SPRING_SNAPPY,
      SPRING_GENTLE,
      SPRING_QUICK,
      SPRING_SQUISH,
    ]) {
      expect(spring).toHaveProperty("damping");
      expect(spring).toHaveProperty("stiffness");
      expect(spring).toHaveProperty("mass");
      expect(typeof spring.damping).toBe("number");
      expect(typeof spring.stiffness).toBe("number");
      expect(typeof spring.mass).toBe("number");
    }
  });

  it("snappy spring has higher stiffness than default", () => {
    expect(SPRING_SNAPPY.stiffness!).toBeGreaterThan(SPRING_DEFAULT.stiffness!);
  });

  it("quick spring has higher stiffness than snappy", () => {
    expect(SPRING_QUICK.stiffness!).toBeGreaterThan(SPRING_SNAPPY.stiffness!);
  });

  it("squish spring is lighter and bouncier than snappy", () => {
    expect(SPRING_SQUISH.mass!).toBeLessThan(SPRING_SNAPPY.mass!);
    expect(SPRING_SQUISH.damping!).toBeLessThan(SPRING_SNAPPY.damping!);
    expect(SPRING_SQUISH.stiffness!).toBeGreaterThan(SPRING_SNAPPY.stiffness!);
  });

  it("gentle spring has lower stiffness than default", () => {
    expect(SPRING_GENTLE.stiffness!).toBeLessThan(SPRING_DEFAULT.stiffness!);
  });

  it("exports a reduced motion duration constant", () => {
    expect(REDUCED_MOTION_DURATION).toBe(150);
  });
});
