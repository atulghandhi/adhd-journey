import { render, screen } from "@testing-library/react";

import Home from "../app/page";

describe("web home page", () => {
  it("renders the milestone scaffold content", () => {
    render(<Home />);

    expect(screen.getByText("Next Thing")).toBeTruthy();
    expect(screen.getByText(/shared package check/i)).toBeTruthy();
  });
});
