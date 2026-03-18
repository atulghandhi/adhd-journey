import { appMetadata } from "@focuslab/shared";

import { queryClient } from "../lib/queryClient";
import { mobileTheme } from "../theme/tokens";

describe("mobile scaffold", () => {
  it("wires shared metadata and local tokens into the mobile workspace", () => {
    expect(appMetadata.name).toBe("FocusLab");
    expect(mobileTheme.colors.primary).toBe("#40916C");
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60_000);
  });
});
