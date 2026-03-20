import { getJourneyMapNodePosition } from "../components/journeyMapUtils";

describe("journey map node positions", () => {
  it("alternates left and right positions", () => {
    expect(getJourneyMapNodePosition(0)).toBe("left");
    expect(getJourneyMapNodePosition(1)).toBe("right");
    expect(getJourneyMapNodePosition(2)).toBe("left");
    expect(getJourneyMapNodePosition(3)).toBe("right");
  });
});
