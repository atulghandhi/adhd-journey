import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CompletionCheckInInput, SkipCheckInInput } from "@focuslab/shared";

import { submitCompletionCheckIn, submitReviewCheckIn, submitSkipCheckIn } from "../lib/journey-api";
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

  const skipMutation = useMutation({
    mutationFn: async (args: { input: SkipCheckInInput; taskId: string }) =>
      submitSkipCheckIn(args.taskId, args.input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journey-state"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    reviewMutation,
    submitCompletionCheckIn: completionMutation.mutateAsync,
    submitReviewCheckIn: reviewMutation.mutateAsync,
    submitSkipCheckIn: skipMutation.mutateAsync,
    submittingCompletion: completionMutation.isPending,
    submittingReview: reviewMutation.isPending,
    submittingSkip: skipMutation.isPending,
  };
}
