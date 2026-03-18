import { useQuery } from "@tanstack/react-query";

import { fetchJourneyState } from "../lib/journey-api";
import { useAuth } from "./useAuth";

export function useJourneyState() {
  const { user } = useAuth();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: fetchJourneyState,
    queryKey: ["journey-state", user?.id],
  });
}
