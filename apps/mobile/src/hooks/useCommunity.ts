import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

async function fetchThread(taskId: string) {
  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (postsError) {
    throw postsError;
  }

  const postIds = (posts ?? []).map((post) => post.id);
  const userIds = [...new Set((posts ?? []).map((post) => post.user_id))];
  const [repliesResponse, reactionsResponse, authorsResponse] = await Promise.all([
    postIds.length > 0
      ? supabase.from("community_replies").select("*").in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("community_reactions").select("*").in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabase.from("profiles").select("id,name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (repliesResponse.error) {
    throw repliesResponse.error;
  }

  if (reactionsResponse.error) {
    throw reactionsResponse.error;
  }

  if (authorsResponse.error) {
    throw authorsResponse.error;
  }

  const authorsById = new Map(
    (authorsResponse.data ?? []).map((author) => [author.id, author.name]),
  );

  return (posts ?? []).map((post) => ({
    ...post,
    authorName: authorsById.get(post.user_id) ?? "FocusLab user",
    reactions: (reactionsResponse.data ?? []).filter(
      (reaction) => reaction.post_id === post.id,
    ),
    replies: (repliesResponse.data ?? []).filter((reply) => reply.post_id === post.id),
  }));
}

export function useCommunityThread(taskId: string | null) {
  return useQuery({
    enabled: Boolean(taskId),
    queryFn: () => fetchThread(taskId!),
    queryKey: ["community-thread", taskId],
  });
}

export function useCommunityActions(taskId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["community-thread", taskId] });

  const createPost = useMutation({
    mutationFn: async (body: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !taskId) {
        throw new Error("You need to be signed in.");
      }

      const { error } = await supabase.from("community_posts").insert({
        body,
        task_id: taskId,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidate,
  });

  const createReply = useMutation({
    mutationFn: async (args: { body: string; postId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You need to be signed in.");
      }

      const { error } = await supabase.from("community_replies").insert({
        body: args.body,
        post_id: args.postId,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidate,
  });

  const toggleReaction = useMutation({
    mutationFn: async (args: { emoji: string; postId: string; reacted: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You need to be signed in.");
      }

      if (args.reacted) {
        const { error } = await supabase
          .from("community_reactions")
          .delete()
          .eq("post_id", args.postId)
          .eq("emoji", args.emoji)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.from("community_reactions").insert({
        emoji: args.emoji,
        post_id: args.postId,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidate,
  });

  const reportPost = useMutation({
    mutationFn: async (args: { postId: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You need to be signed in.");
      }

      const { error } = await supabase.from("community_reports").insert({
        post_id: args.postId,
        reason: args.reason,
        reporter_user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
  });

  return {
    createPost,
    createReply,
    reportPost,
    toggleReaction,
  };
}
