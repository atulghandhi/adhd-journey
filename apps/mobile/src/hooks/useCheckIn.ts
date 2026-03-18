import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CompletionCheckInInput } from "@focuslab/shared";

import { submitCompletionCheckIn, submitReviewCheckIn } from "../lib/journey-api";
import { useOfflineQueueStore } from "../stores/offlineQueueStore";

export function useCheckIn() {
  const queryClient = useQueryClient();
  const enqueueCheckIn = useOfflineQueueStore((state) => state.enqueueCheckIn);

  const completionMutation = useMutation({
    mutationFn: async (args: { input: CompletionCheckInInput; taskId: string }) =>
      submitCompletionCheckIn(args.taskId, args.input),
    onError: (_error, variables) => {
      enqueueCheckIn({
        id: crypto.randomUUID(),
        input: variables.input,
        taskId: variables.taskId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journey-state"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: submitReviewCheckIn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journey-state"] });
    },
  });

  return {
    reviewMutation,
    submitCompletionCheckIn: completionMutation.mutateAsync,
    submitReviewCheckIn: reviewMutation.mutateAsync,
    submittingCompletion: completionMutation.isPending,
    submittingReview: reviewMutation.isPending,
  };
}
