describe("ScienceCard content guard", () => {
  const PLACEHOLDER = "The science behind this task will be added here.";

  function shouldRender(content: string | null | undefined): boolean {
    return Boolean(content) && content !== PLACEHOLDER;
  }

  it("hides when content is null", () => {
    expect(shouldRender(null)).toBe(false);
  });

  it("hides when content is undefined", () => {
    expect(shouldRender(undefined)).toBe(false);
  });

  it("hides when content is the placeholder string", () => {
    expect(shouldRender(PLACEHOLDER)).toBe(false);
  });

  it("shows when content has real markdown", () => {
    expect(shouldRender("## Why this works\n\nBecause science.")).toBe(true);
  });

  it("hides when content is empty string", () => {
    expect(shouldRender("")).toBe(false);
  });
});
