import { useEffect } from "react";

import { MarkdownBlock } from "../MarkdownBlock";
import type { TaskCompletionChange } from "./types";

interface MarkdownTaskProps {
  onCompletionChange: TaskCompletionChange;
  taskBody: string;
}

export function MarkdownTask({
  onCompletionChange,
  taskBody,
}: MarkdownTaskProps) {
  useEffect(() => {
    onCompletionChange(true);
  }, [onCompletionChange]);

  return <MarkdownBlock content={taskBody} />;
}
