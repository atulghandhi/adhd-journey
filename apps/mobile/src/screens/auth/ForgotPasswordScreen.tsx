import { useState } from "react";
import { ActivityIndicator } from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { Pressable, Text, TextInput } from "../../components/primitives";
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
        className="rounded-[14px] border border-focuslab-border bg-[#F8FFFA] px-4 py-3.5 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
      />
      <Pressable
        className="items-center rounded-[14px] bg-focuslab-primary py-3.5"
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-bold text-white">Send reset email</Text>
        )}
      </Pressable>
      {message ? (
        <Text className="text-sm leading-[22px] text-gray-600 dark:text-dark-text-secondary">
          {message}
        </Text>
      ) : null}
    </AuthScaffold>
  );
}

