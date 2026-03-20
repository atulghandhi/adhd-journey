export type TaskInteractionData = Record<string, unknown> | undefined;

export type TaskCompletionChange = (
  complete: boolean,
  data?: Record<string, unknown>,
) => void;

export interface InteractiveTaskProps {
  config: unknown;
  onCompletionChange: TaskCompletionChange;
}
