import { useQuery } from "@tanstack/react-query";

import { fetchRevenueCatOffering, hasActiveEntitlement, isRevenueCatConfigured } from "../lib/revenuecat";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export function useEntitlement() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const configured = isRevenueCatConfigured();

  const entitlementQuery = useQuery({
    enabled: Boolean(user?.id && configured),
    queryFn: () => hasActiveEntitlement(user?.id),
    queryKey: ["revenuecat-entitlement", user?.id],
    retry: false,
  });
  const offeringQuery = useQuery({
    enabled: Boolean(user?.id && configured),
    queryFn: () => fetchRevenueCatOffering(user?.id),
    queryKey: ["revenuecat-offering", user?.id],
    retry: false,
  });

  return {
    isConfigured: configured,
    isLoading: entitlementQuery.isLoading || offeringQuery.isLoading || profileQuery.isLoading,
    isPaid:
      profileQuery.data?.payment_status === "paid" ||
      entitlementQuery.data === true,
    offering: offeringQuery.data,
    profile: profileQuery.data ?? null,
    refresh: async () => {
      await Promise.all([entitlementQuery.refetch(), offeringQuery.refetch(), profileQuery.refetch()]);
    },
  };
}
