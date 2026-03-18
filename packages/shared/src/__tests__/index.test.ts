import { appMetadata, sharedPlaceholder } from "../index";

describe("shared exports", () => {
  it("exposes app metadata", () => {
    expect(appMetadata.name).toBe("FocusLab");
  });

  it("exposes a placeholder string for cross-app imports", () => {
    expect(sharedPlaceholder).toContain("wired up");
  });
});
