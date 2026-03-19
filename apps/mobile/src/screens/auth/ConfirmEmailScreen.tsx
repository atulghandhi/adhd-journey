import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator } from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { Pressable, Text } from "../../components/primitives";
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
      <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
        {email
          ? `Open the message we sent to ${email} and tap the confirmation link.`
          : "Open the confirmation email we just sent you and tap the link."}
      </Text>
      <Pressable
        className="items-center rounded-[14px] bg-focuslab-primary py-3.5"
        onPress={handleResend}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-bold text-white">Resend confirmation</Text>
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

