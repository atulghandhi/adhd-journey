import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator } from "react-native";

import { AuthScaffold } from "../../components/AuthScaffold";
import { Pressable, Text, TextInput, View } from "../../components/primitives";
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

    // Temporary testing bypass while Supabase email confirmation is disabled.
    // router.replace({
    //   pathname: "/auth/confirm-email",
    //   params: { email: email.trim() },
    // } as never);

    router.replace("/" as never);
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="We only need a few details to sync FocusLab across your devices."
    >
      <TextInput
        className="rounded-[14px] border border-focuslab-border bg-[#F8FFFA] px-4 py-3.5 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
        onChangeText={setName}
        placeholder="Name"
        value={name}
      />
      <TextInput
        autoCapitalize="none"
        className="rounded-[14px] border border-focuslab-border bg-[#F8FFFA] px-4 py-3.5 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
      />
      <TextInput
        className="rounded-[14px] border border-focuslab-border bg-[#F8FFFA] px-4 py-3.5 text-base text-focuslab-primaryDark dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      {errorMessage ? (
        <Text className="text-sm text-[#B91C1C]">{errorMessage}</Text>
      ) : null}
      <Pressable
        className="items-center rounded-[14px] bg-focuslab-primary py-3.5"
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-bold text-white">Register</Text>
        )}
      </Pressable>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[15px] text-gray-600 dark:text-dark-text-secondary">
          Already registered?
        </Text>
        <Link
          className="text-[15px] font-semibold text-focuslab-primary"
          href={"/auth/login" as never}
        >
          Sign in
        </Link>
      </View>
    </AuthScaffold>
  );
}
