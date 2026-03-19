import { useRouter } from "expo-router";

import {
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "../../components/primitives";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

export function JourneyHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-focuslab-secondary dark:text-dark-text-secondary">Journey</Text>
        <Text className="text-[30px] font-bold text-focuslab-primaryDark dark:text-dark-text-primary">You’re signed in.</Text>
        <Text className="text-base leading-[26px] text-focuslab-secondary dark:text-dark-text-secondary">
          {user?.email ? `Authenticated as ${user.email}.` : "Your session is active."}
        </Text>
        <Pressable
          className="items-center self-start rounded-[14px] border border-focuslab-border px-[18px] py-3 dark:border-dark-border"
          onPress={handleSignOut}
        >
          <Text className="text-[15px] font-semibold text-focuslab-secondary dark:text-dark-text-secondary">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
