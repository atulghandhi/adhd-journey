import { appMetadata, sharedPlaceholder } from "@focuslab/shared";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BootstrapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{appMetadata.name}</Text>
          <Text style={styles.subtitle}>{appMetadata.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Milestone 01</Text>
          <Text style={styles.cardTitle}>Workspace scaffolded.</Text>
          <Text style={styles.cardBody}>{sharedPlaceholder}</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    gap: 16,
  },
  title: {
    color: "#1B4332",
    fontSize: 36,
    fontWeight: "700",
  },
  subtitle: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1B4332",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  eyebrow: {
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#1B4332",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardBody: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 28,
  },
});
