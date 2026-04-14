import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BootstrapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Next Thing</Text>
          <Text style={styles.subtitle}>Loading your journey…</Text>
          <ActivityIndicator color="#40916C" size="large" style={styles.spinner} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0FFF4",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  center: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: "#1B4332",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
