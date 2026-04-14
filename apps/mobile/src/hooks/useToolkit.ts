import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ToolkitItem, ToolkitStatus } from "@focuslab/shared";

import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

const TOOLKIT_QUERY_KEY = "toolkit-items";

export function useToolkit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], ...query } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkit_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as ToolkitItem[];
    },
    queryKey: [TOOLKIT_QUERY_KEY, user?.id],
  });

  const upsert = useMutation({
    mutationFn: async (args: { status: ToolkitStatus; taskId: string }) => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("toolkit_items")
        .upsert(
          {
            status: args.status,
            task_id: args.taskId,
            user_id: userData.user.id,
          },
          { onConflict: "user_id,task_id,journey_id" },
        );

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [TOOLKIT_QUERY_KEY],
      });
    },
  });

  const remove = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("toolkit_items")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", user!.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [TOOLKIT_QUERY_KEY],
      });
    },
  });

  const keepItems = items.filter((i) => i.status === "keep");
  const maybeItems = items.filter((i) => i.status === "maybe_later");
  const dismissedItems = items.filter((i) => i.status === "not_for_me");

  const getStatusForTask = (taskId: string): ToolkitStatus | null => {
    const item = items.find((i) => i.task_id === taskId);
    return item?.status ?? null;
  };

  return {
    dismissedItems,
    getStatusForTask,
    items,
    keepItems,
    maybeItems,
    query,
    remove,
    upsert,
  };
}
