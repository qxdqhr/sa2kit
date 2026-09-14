import { useCallback } from 'react';
import {
  Question,
  UserAnswer,
  QuestionType,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  FillBlankQuestion,
} from '../../types';

export const useScoring = (questions: Question[], userAnswers: UserAnswer[]) => {
  const calculateScore = useCallback(() => {
    let score = 0;
    let totalPoints = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach((question) => {
      totalPoints += question.score;
      const userAnswer = userAnswers.find((answer) => answer.questionId === question.id);

      const hasSelectionAnswer = !!userAnswer && userAnswer.selectedOptions.length > 0;
      const hasTextAnswer = !!userAnswer?.textAnswer?.trim();

      if (!userAnswer || (!hasSelectionAnswer && !hasTextAnswer)) {
        unansweredCount++;
        return;
      }

      let isCorrect = false;

      switch (question.type) {
        case QuestionType.SingleChoice:
          isCorrect = (question as SingleChoiceQuestion).answer === userAnswer.selectedOptions[0];
          break;

        case QuestionType.MultipleChoice: {
          const multiQuestion = question as MultipleChoiceQuestion;
          isCorrect =
            multiQuestion.answers.length === userAnswer.selectedOptions.length &&
            multiQuestion.answers.every((answer) => userAnswer.selectedOptions.includes(answer));
          break;
        }

        case QuestionType.FillBlank: {
          const fillQuestion = question as FillBlankQuestion;
          const inputAnswers = (userAnswer.textAnswer || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

          isCorrect =
            fillQuestion.answers.length === inputAnswers.length &&
            fillQuestion.answers.every((answer, index) => inputAnswers[index] === answer);
          break;
        }

        case QuestionType.ShortAnswer:
        case QuestionType.Essay:
          unansweredCount++;
          return;
      }

      if (isCorrect) {
        score += question.score;
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    return {
      score: isNaN(score) ? 0 : score,
      totalPoints: isNaN(totalPoints) ? 1 : totalPoints,
      correctAnswers: isNaN(correctCount) ? 0 : correctCount,
      incorrectAnswers: isNaN(incorrectCount) ? 0 : incorrectCount,
      unanswered: isNaN(unansweredCount) ? 0 : unansweredCount,
    };
  }, [questions, userAnswers]);

  return { calculateScore };
};
