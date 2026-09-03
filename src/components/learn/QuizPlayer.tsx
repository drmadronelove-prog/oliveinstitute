"use client";

import { useState } from "react";

export type QuizPlayerQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

/**
 * A module's optional knowledge check. Untimed, unlimited attempts, never
 * scored, and never reported anywhere that could gate progress or the
 * certificate — picking an answer just reveals whether it's right and
 * shows the explanation, right there, with nothing saved and nothing
 * stopping a learner from picking a different option immediately after.
 */
export function QuizPlayer({ questions }: { questions: QuizPlayerQuestion[] }) {
  const [selected, setSelected] = useState<Record<string, number>>({});

  if (questions.length === 0) {
    return (
      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        This knowledge check has no questions yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, index) => {
        const picked = selected[question.id];
        const answered = picked !== undefined;

        return (
          <fieldset key={question.id} className="rounded-lg bg-[var(--color-sage-pale)] p-4">
            <legend className="mb-2 px-1 font-body text-sm font-medium text-[var(--color-ink)]">
              {index + 1}. {question.prompt}
            </legend>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isPicked = picked === optionIndex;
                const isCorrect = optionIndex === question.correctIndex;
                const showState = answered && isPicked;

                return (
                  <label
                    key={optionIndex}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 font-body text-sm transition-colors ${
                      showState
                        ? isCorrect
                          ? "border-[var(--color-olive)] bg-[var(--color-olive)]/10 text-[var(--color-ink)]"
                          : "border-[var(--color-terracotta)] bg-[var(--color-terracotta)]/10 text-[var(--color-ink)]"
                        : "border-black/10 bg-white text-[var(--color-ink)] hover:bg-[var(--color-sage-pale-deep)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-question-${question.id}`}
                      checked={isPicked}
                      onChange={() =>
                        setSelected((prev) => ({ ...prev, [question.id]: optionIndex }))
                      }
                    />
                    {option}
                    {showState ? (
                      <span className="ml-auto font-medium">
                        {isCorrect ? "Correct" : "Not quite"}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {answered && question.explanation ? (
              <p className="mt-3 font-body text-sm text-[var(--color-ink-muted)]">
                {question.explanation}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
