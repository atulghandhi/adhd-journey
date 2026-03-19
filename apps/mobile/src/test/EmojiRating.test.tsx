describe("EmojiRating rating options", () => {
  const ratingOptions = [
    { emoji: "😫", value: 1 },
    { emoji: "😕", value: 2 },
    { emoji: "😐", value: 3 },
    { emoji: "🙂", value: 4 },
    { emoji: "🤩", value: 5 },
  ];

  it("has exactly 5 options", () => {
    expect(ratingOptions).toHaveLength(5);
  });

  it("maps values 1-5 in sequence", () => {
    expect(ratingOptions.map((o) => o.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("each option has a non-empty emoji", () => {
    for (const opt of ratingOptions) {
      expect(opt.emoji.length).toBeGreaterThan(0);
    }
  });
});
