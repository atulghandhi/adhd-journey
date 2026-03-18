import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { supabase } from "../../lib/supabase";

export function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setMessage("Add your email again if you need a new confirmation link.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
    });

    setIsSubmitting(false);
    setMessage(error ? error.message : "Confirmation email sent.");
  };

  return (
    <AuthScaffold
      title="Check your email"
      subtitle="We sent a confirmation link so you can finish setting up FocusLab."
    >
      <Text style={styles.body}>
        {email
          ? `Open the message we sent to ${email} and tap the confirmation link.`
          : "Open the confirmation email we just sent you and tap the link."}
      </Text>
      <Pressable onPress={handleResend} style={styles.primaryButton}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Resend confirmation</Text>
        )}
      </Pressable>
      {message ? <Text style={styles.helperText}>{message}</Text> : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#2D6A4F",
    fontSize: 16,
    lineHeight: 28,
  },
  helperText: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 22,
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
