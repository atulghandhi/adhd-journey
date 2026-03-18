import { buildQuizAttempt, scoreQuizAttempt } from "..";

const questions = Array.from({ length: 20 }, (_, index) => ({
  correct_index: index % 4,
  created_at: "2026-03-17T00:00:00.000Z",
  id: `question-${index + 1}`,
  options: ["A", "B", "C", "D"],
  question: `Question ${index + 1}`,
  task_id: `task-${index + 1}`,
}));

describe("quiz helpers", () => {
  it("builds a deterministic fifteen-question attempt", () => {
    const attempt = buildQuizAttempt(questions, 15, 42);

    expect(attempt).toHaveLength(15);
    expect(attempt[0]?.id).toBe("question-8");
  });

  it("scores correct answers and returns a recommendation", () => {
    const attempt = buildQuizAttempt(questions, 3, 1);
    const score = scoreQuizAttempt(attempt, {
      [attempt[0]!.id]: attempt[0]!.correctIndex,
      [attempt[1]!.id]: 99,
      [attempt[2]!.id]: attempt[2]!.correctIndex,
    });

    expect(score.correct).toBe(2);
    expect(score.total).toBe(3);
    expect(score.recommendation).toContain("revisiting");
  });
});
