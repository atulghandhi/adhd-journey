import { appMetadata, sharedPlaceholder } from "../index";

describe("shared exports", () => {
  it("exposes app metadata", () => {
    expect(appMetadata.name).toBe("Next Thing");
  });

  it("exposes a placeholder string for cross-app imports", () => {
    expect(sharedPlaceholder).toContain("wired up");
  });
});
