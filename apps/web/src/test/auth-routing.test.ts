import { getProtectedWebRedirect } from "../lib/auth-routing";

describe("web auth routing", () => {
  it("redirects signed-out users to login", () => {
    expect(getProtectedWebRedirect()).toBe("/auth/login");
  });

  it("allows signed-in users to stay on protected routes", () => {
    expect(getProtectedWebRedirect("user-id")).toBeNull();
  });
});
