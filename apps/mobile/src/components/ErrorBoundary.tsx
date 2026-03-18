import type { PropsWithChildren, ReactNode } from "react";
import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: Error) {
    console.error("[mobile-error-boundary]", error.message);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              FocusLab hit a snag, but your progress is still safe. Let&apos;s try
              again.
            </Text>
            <Pressable onPress={this.handleRetry} style={styles.button}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#40916C",
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    gap: 16,
    padding: 24,
  },
  safeArea: {
    backgroundColor: "#F0FFF4",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  subtitle: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: "#1B4332",
    fontSize: 28,
    fontWeight: "700",
  },
});
