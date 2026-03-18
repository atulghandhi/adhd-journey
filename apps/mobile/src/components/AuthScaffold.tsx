import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthScaffoldProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthScaffold({ children, subtitle, title }: AuthScaffoldProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.card}>{children}</View>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    gap: 12,
    marginBottom: 24,
  },
  title: {
    color: "#1B4332",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 26,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    gap: 16,
    padding: 24,
    shadowColor: "#1B4332",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
});
