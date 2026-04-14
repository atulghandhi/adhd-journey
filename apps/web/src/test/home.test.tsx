import { render, screen } from "@testing-library/react";

import Home from "../app/page";

describe("web home page", () => {
  it("renders the landing page content", () => {
    render(<Home />);

    expect(screen.getByText("Next Thing")).toBeTruthy();
    expect(screen.getByText(/30 daily strategies/i)).toBeTruthy();
  });
});
