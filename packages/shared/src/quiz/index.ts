import type { QuizAttemptQuestion, QuizQuestionRow, QuizScore } from "../types";

function normalizeQuizOptions(value: QuizQuestionRow["options"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((option): option is string => typeof option === "string");
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;

    return state / 4294967296;
  };
}

function shuffleWithSeed<T>(values: T[], seed: number) {
  const random = seededRandom(seed);
  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const current = nextValues[index];
    nextValues[index] = nextValues[target] as T;
    nextValues[target] = current as T;
  }

  return nextValues;
}

export function buildQuizAttempt(
  questions: QuizQuestionRow[],
  count = 15,
  seed = 30,
) {
  return shuffleWithSeed(
    questions.map<QuizAttemptQuestion>((question) => ({
      correctIndex: question.correct_index,
      id: question.id,
      options: normalizeQuizOptions(question.options),
      question: question.question,
      taskId: question.task_id,
    })),
    seed,
  ).slice(0, count);
}

export function scoreQuizAttempt(
  questions: QuizAttemptQuestion[],
  answers: Record<string, number>,
) {
  const correct = questions.reduce((total, question) => {
    return total + (answers[question.id] === question.correctIndex ? 1 : 0);
  }, 0);
  const total = questions.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    correct,
    percentage,
    recommendation:
      percentage >= 80 ? "Great retention!" : "Consider revisiting the areas you missed.",
    total,
  } satisfies QuizScore;
}
