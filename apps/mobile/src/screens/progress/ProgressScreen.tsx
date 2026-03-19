import { useQuery } from "@tanstack/react-query";

import { AppCard } from "../../components/ui/AppCard";
import { JourneyMap } from "../../components/JourneyMap";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useJourneyState } from "../../hooks/useJourneyState";

export function ProgressScreen() {
  const { user } = useAuth();
  const { data: state } = useJourneyState();
  const { data: checkIns } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .order("checked_in_at", { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    queryKey: ["check-ins", user?.id],
  });

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Progress
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your journey map
          </Text>
        </View>

        {state ? (
          <AppCard>
            <JourneyMap state={state} />
          </AppCard>
        ) : null}

        <AppCard>
          <Text className="text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
            Your journey
          </Text>
          <View className="mt-4 gap-3">
            {(checkIns ?? []).map((checkIn) => (
              <View
                className="rounded-2xl bg-focuslab-background px-4 py-4 dark:bg-dark-bg"
                key={checkIn.id}
              >
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
                  {new Date(checkIn.checked_in_at).toLocaleDateString()}
                </Text>
                <Text className="mt-2 text-base text-focuslab-primaryDark dark:text-dark-text-primary">
                  Rating {checkIn.quick_rating} · {checkIn.type.replace("_", " ")}
                </Text>
              </View>
            ))}
            {!checkIns || checkIns.length === 0 ? (
              <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
                Complete your first check-in to see your journey here.
              </Text>
            ) : null}
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
