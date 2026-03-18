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

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace({
      pathname: "/auth/confirm-email",
      params: { email: email.trim() },
    } as never);
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="We only need a few details to sync FocusLab across your devices."
    >
      <TextInput onChangeText={setName} placeholder="Name" style={styles.input} value={name} />
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
          <Text style={styles.primaryButtonText}>Register</Text>
        )}
      </Pressable>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already registered?</Text>
        <Link href={"/auth/login" as never} style={styles.footerLink}>
          Sign in
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
});
