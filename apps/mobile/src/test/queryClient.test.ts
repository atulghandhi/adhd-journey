import { queryClient } from "../lib/queryClient";

describe("queryClient defaults", () => {
  it("has throwOnError disabled for queries", () => {
    expect(queryClient.getDefaultOptions().queries?.throwOnError).toBe(false);
  });

  it("has a global mutation onError handler", () => {
    expect(typeof queryClient.getDefaultOptions().mutations?.onError).toBe(
      "function",
    );
  });

  it("retries queries once", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
  });

  it("keeps staleTime at 60 seconds", () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60_000);
  });
});
