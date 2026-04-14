import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        console.warn("[query-client] mutation error:", error.message);
      },
    },
    queries: {
      retry: 1,
      staleTime: 60_000,
      throwOnError: false,
    },
  },
});
