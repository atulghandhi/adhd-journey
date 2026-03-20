import { getStreakBadgePresentation } from "../components/streakBadgeUtils";

describe("streak badge presentation", () => {
  it("shows a dimmed presentation at zero", () => {
    const presentation = getStreakBadgePresentation(0);

    expect(presentation.active).toBe(false);
    expect(presentation.iconColor).toBe("#9CA3AF");
    expect(presentation.containerClass).toContain("bg-gray-200");
  });

  it("shows an active presentation for non-zero streaks", () => {
    const presentation = getStreakBadgePresentation(3, "lg");

    expect(presentation.active).toBe(true);
    expect(presentation.iconColor).toBe("#FFFFFF");
    expect(presentation.iconSize).toBe(18);
    expect(presentation.textClass).toContain("text-lg");
  });
});
