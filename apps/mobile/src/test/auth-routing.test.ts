import { getMobileEntryRoute, getProtectedMobileRedirect } from "../lib/auth-routing";

describe("mobile auth routing", () => {
  it("sends signed-out users to login", () => {
    expect(getMobileEntryRoute(null)).toBe("/auth/login");
    expect(getProtectedMobileRedirect(null)).toBe("/auth/login");
  });

  it("sends signed-in users to the journey", () => {
    const session = { access_token: "token" } as never;

    expect(getMobileEntryRoute(session)).toBe("/journey");
    expect(getProtectedMobileRedirect(session)).toBeNull();
  });
});
