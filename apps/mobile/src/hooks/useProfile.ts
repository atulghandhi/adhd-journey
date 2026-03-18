import { useQuery } from "@tanstack/react-query";

import { fetchProfile } from "../lib/profile";
import { useAuth } from "./useAuth";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => fetchProfile(user!.id),
    queryKey: ["profile", user?.id],
  });
}
