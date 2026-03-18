import { buildQuizAttempt, scoreQuizAttempt } from "@focuslab/shared";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppCard } from "../../components/ui/AppCard";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../components/primitives";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export function QuizScreen() {
  const { user } = useAuth();
  const { data: questions } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_questions").select("*");

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    queryKey: ["quiz-questions", user?.id],
  });
  const attempt = useMemo(() => buildQuizAttempt(questions ?? [], 15, 42), [questions]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const result = useMemo(
    () =>
      Object.keys(answers).length === attempt.length
        ? scoreQuizAttempt(attempt, answers)
        : null,
    [answers, attempt],
  );

  return (
    <SafeAreaView className="flex-1 bg-focuslab-background">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
            Quiz
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
            How much stuck?
          </Text>
        </View>

        {attempt.map((question, index) => (
          <AppCard key={question.id}>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary">
              Question {index + 1}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-focuslab-primaryDark">
              {question.question}
            </Text>
            <View className="mt-4 gap-3">
              {question.options.map((option, optionIndex) => (
                <PrimaryButton
                  key={`${question.id}-${optionIndex}`}
                  onPress={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: optionIndex,
                    }))
                  }
                >
                  {answers[question.id] === optionIndex ? `✓ ${option}` : option}
                </PrimaryButton>
              ))}
            </View>
          </AppCard>
        ))}

        {result ? (
          <AppCard>
            <Text className="text-2xl font-bold text-focuslab-primaryDark">
              {result.correct}/{result.total}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary">
              {result.recommendation}
            </Text>
          </AppCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
