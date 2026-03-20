export function getJourneyMapNodePosition(index: number) {
  return index % 2 === 0 ? "left" : "right";
}

export function getJourneyMapConnectorPath(
  fromPosition: "left" | "right",
  toPosition: "left" | "right",
) {
  const fromX = fromPosition === "left" ? 26 : 74;
  const toX = toPosition === "left" ? 26 : 74;

  return `M ${fromX} 8 Q 50 36 ${toX} 64`;
}
