export function getStreakBadgePresentation(
  count: number,
  size: "sm" | "lg" = "sm",
) {
  const active = count > 0;

  return {
    active,
    containerClass: active
      ? "bg-[#22C55E]"
      : "bg-gray-200 dark:bg-gray-700",
    iconColor: active ? "#FFFFFF" : "#9CA3AF",
    iconSize: size === "lg" ? 18 : 14,
    paddingClass: size === "lg" ? "px-4 py-3" : "px-3 py-2",
    textClass: active
      ? size === "lg"
        ? "text-lg font-semibold text-white"
        : "text-sm font-semibold text-white"
      : size === "lg"
        ? "text-lg font-semibold text-gray-400 dark:text-gray-500"
        : "text-sm font-semibold text-gray-400 dark:text-gray-500",
  };
}
