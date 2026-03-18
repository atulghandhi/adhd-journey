import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { supabase } from "../../lib/supabase";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    setIsSubmitting(false);
    setMessage(
      error ? error.message : "If that email exists, a password reset message is on the way.",
    );
  };

  return (
    <AuthScaffold
      title="Reset password"
      subtitle="We’ll send a password reset email to the address on your account."
    >
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <Pressable onPress={handleSubmit} style={styles.primaryButton}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Send reset email</Text>
        )}
      </Pressable>
      {message ? <Text style={styles.helperText}>{message}</Text> : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 22,
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
