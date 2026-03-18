import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { supabase } from "../../lib/supabase";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/journey" as never);
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to keep your journey synced across devices."
    >
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Pressable onPress={handleSubmit} style={styles.primaryButton}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign in</Text>
        )}
      </Pressable>
      <Link href={"/auth/forgot-password" as never} style={styles.secondaryLink}>
        Forgot your password?
      </Link>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Need an account?</Text>
        <Link href={"/auth/register" as never} style={styles.footerLink}>
          Create one
        </Link>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
  },
  footerLink: {
    color: "#40916C",
    fontSize: 15,
    fontWeight: "600",
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  footerText: {
    color: "#4B5563",
    fontSize: 15,
  },
  input: {
    backgroundColor: "#F8FFFA",
    borderColor: "#B7E4C7",
    borderRadius: 14,
    borderWidth: 1,
    color: "#1B4332",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#40916C",
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryLink: {
    color: "#2D6A4F",
    fontSize: 15,
    fontWeight: "500",
  },
});
