import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RESOURCE_LINKS } from "@focuslab/shared";
import type { Database } from "@focuslab/shared";
import * as Linking from "expo-linking";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { supabase } from "../../lib/supabase";

type RewardResourceRow = Database["public"]["Tables"]["reward_resources"]["Row"];

export function ResourcesScreen() {
  const { data: resources } = useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_resources")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        throw error;
      }

      return (data ?? []) as RewardResourceRow[];
    },
    queryKey: ["reward-resources"],
    retry: false,
  });
  const resourceCards =
    resources && resources.length > 0
      ? resources.map((resource) => ({
          description: resource.description,
          title: resource.title,
          url: resource.url,
        }))
      : DEFAULT_RESOURCE_LINKS;

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
            Resources
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
          Keep the momentum going.
          </Text>
        </View>
        {resourceCards.map((resource) => (
          <AppCard key={resource.title}>
            <Text className="text-xl font-semibold text-focuslab-primaryDark">
              {resource.title}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
              {resource.description}
            </Text>
            <View className="mt-4">
              <PrimaryButton
                onPress={() => {
                  void Linking.openURL(resource.url);
                }}
              >
                Open resource
              </PrimaryButton>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
