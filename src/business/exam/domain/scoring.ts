import {
  ExamQuestionType,
  type ExamQuestion,
  type ExamUserAnswer,
  type ExamScoreSummary,
} from './types';

export function calculateSelectionScore(
  questions: ExamQuestion[],
  userAnswers: ExamUserAnswer[]
): ExamScoreSummary {
  let score = 0;
  let totalPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    totalPoints += question.score || 0;
    const userAnswer = userAnswers.find((answer) => answer.questionId === question.id);

    if (!userAnswer || userAnswer.selectedOptions.length === 0) {
      unansweredCount += 1;
      continue;
    }

    let isCorrect = false;

    if (question.type === ExamQuestionType.SingleChoice && 'answer' in question) {
      isCorrect = question.answer === userAnswer.selectedOptions[0];
    } else if (question.type === ExamQuestionType.MultipleChoice && 'answers' in question) {
      isCorrect =
        question.answers.length === userAnswer.selectedOptions.length &&
        question.answers.every((answer) => userAnswer.selectedOptions.includes(answer));
    } else {
      unansweredCount += 1;
      continue;
    }

    if (isCorrect) {
      score += question.score;
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  }

  return {
    score,
    totalPoints,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unanswered: unansweredCount,
  };
}
