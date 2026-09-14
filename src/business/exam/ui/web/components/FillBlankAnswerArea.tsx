"use client";

import { useExam } from '../context';
import styles from '../styles';

const FillBlankAnswerArea = () => {
  const { currentQuestion, userAnswers, handleTextAnswer } = useExam();

  const currentAnswer = userAnswers.find((answer) => answer.questionId === currentQuestion.id);

  return (
    <div className={styles["options-container"]}>
      <textarea
        className={styles["question-content"]}
        placeholder="请输入答案，多个空可用英文逗号分隔"
        value={currentAnswer?.textAnswer || ''}
        onChange={(event) => handleTextAnswer(currentQuestion.id, event.target.value)}
      />
    </div>
  );
};

export default FillBlankAnswerArea;
