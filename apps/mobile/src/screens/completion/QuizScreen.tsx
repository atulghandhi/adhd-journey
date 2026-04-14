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
  const { data: questions, isLoading, isError } = useQuery({
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
    <SafeAreaView className="flex-1 bg-focuslab-background dark:bg-dark-bg">
      <ScrollView contentContainerStyle={{ gap: 20, padding: 24 }}>
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
            Quiz
          </Text>
          <Text className="mt-2 text-3xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
            How much stuck?
          </Text>
        </View>

        {isLoading ? (
          <AppCard>
            <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Loading questions...
            </Text>
          </AppCard>
        ) : isError ? (
          <AppCard>
            <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              Something went wrong loading the quiz. Please try again later.
            </Text>
          </AppCard>
        ) : attempt.length === 0 ? (
          <AppCard>
            <Text className="text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              No quiz questions available yet. Check back soon.
            </Text>
          </AppCard>
        ) : null}

        {attempt.map((question, index) => (
          <AppCard key={question.id}>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary">
              Question {index + 1}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-focuslab-primaryDark dark:text-dark-text-primary">
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
            <Text className="text-2xl font-bold text-focuslab-primaryDark dark:text-dark-text-primary">
              {result.correct}/{result.total}
            </Text>
            <Text className="mt-2 text-base leading-7 text-focuslab-secondary dark:text-dark-text-secondary">
              {result.recommendation}
            </Text>
          </AppCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
