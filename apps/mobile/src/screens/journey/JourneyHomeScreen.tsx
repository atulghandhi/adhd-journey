import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Journey</Text>
        <Text style={styles.title}>You’re signed in.</Text>
        <Text style={styles.subtitle}>
          {user?.email ? `Authenticated as ${user.email}.` : "Your session is active."}
        </Text>
        <Pressable onPress={handleSignOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F0FFF4",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#B7E4C7",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#2D6A4F",
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 26,
  },
  title: {
    color: "#1B4332",
    fontSize: 30,
    fontWeight: "700",
  },
});
