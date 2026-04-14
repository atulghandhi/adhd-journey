export function getJourneyMapNodePosition(index: number) {
  return index % 2 === 0 ? "left" : "right";
}

export function getJourneyMapConnectorPath(
  fromPosition: "left" | "right",
  toPosition: "left" | "right",
) {
  const fromX = fromPosition === "left" ? 20 : 80;
  const toX = toPosition === "left" ? 20 : 80;

  return `M ${fromX} 0 C ${fromX} 32, ${toX} 48, ${toX} 80`;
}
