import { urlSchemeForApp } from "../lib/gateway";

describe("urlSchemeForApp", () => {
  it("finds the scheme for a known bundle id", () => {
    expect(urlSchemeForApp({ bundleId: "com.burbn.instagram" })).toBe("instagram://");
  });

  it("falls back to the app name used by the Shortcuts path", () => {
    expect(urlSchemeForApp({ appName: "Instagram" })).toBe("instagram://");
    expect(urlSchemeForApp({ appName: " tiktok " })).toBe("snssdk1233://");
  });

  it("prefers the bundle id when both are known", () => {
    expect(
      urlSchemeForApp({ appName: "youtube", bundleId: "com.reddit.Reddit" }),
    ).toBe("reddit://");
  });

  it("returns null for apps it cannot open", () => {
    expect(urlSchemeForApp({ bundleId: "com.example.unknown" })).toBeNull();
    expect(urlSchemeForApp({ appName: "Some Game" })).toBeNull();
    expect(urlSchemeForApp({})).toBeNull();
  });
});
