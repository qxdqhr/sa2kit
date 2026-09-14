"use client";

import { useExam } from '../context';
import styles from '../styles';

const NavigationControls = () => {
  const {
    goToPreviousQuestion,
    goToNextQuestion,
    isFirstQuestion,
    isLastQuestion,
    handleSubmitExam,
    examSubmitted,
  } = useExam();

  return (
    <div className={styles["controls-container"]}>
      <button
        className={`${styles["nav-button"]} ${styles["prev-button"]} ${isFirstQuestion ? styles.disabled : ''}`}
        onClick={goToPreviousQuestion}
        disabled={isFirstQuestion}
      >
        上一题
      </button>

      {isLastQuestion ? (
        <button
          className={`${styles["nav-button"]} ${styles["submit-button"]}`}
          onClick={handleSubmitExam}
          disabled={examSubmitted}
        >
          提交
        </button>
      ) : (
        <button
          className={`${styles["nav-button"]} ${styles["next-button"]}`}
          onClick={goToNextQuestion}
        >
          下一题
        </button>
      )}
    </div>
  );
};

export default NavigationControls; 