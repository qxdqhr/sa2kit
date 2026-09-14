"use client";

import { useEffect, useState } from 'react';
import { ExamResultReviewList } from '../ExamResultReviewList';
import { useExam } from '../context';
import styles from '../styles';
import { assert } from '../utils/utils';

const ExamResults = () => {
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const {
    questions,
    userAnswers,
    resetExam,
    resetToStart,
    calculateScore,
    resultModalData,
  } = useExam();

  const { score, totalPoints, correctAnswers, incorrectAnswers, unanswered } = calculateScore();

  const percentageScore = Math.round((score / totalPoints) * 100);
  const isPassing = percentageScore > resultModalData.passingScore;

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setShowResults(true);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const modalTimer = setTimeout(() => {
      setShowModal(true);
    }, resultModalData.showDelayTime);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(modalTimer);
    };
  }, [resultModalData.showDelayTime]);

  const reviewQuestions = questions.map((question) => ({
    id: question.id,
    type: question.type,
    content: question.content,
    options: 'options' in question ? question.options : undefined,
    answer: 'answer' in question ? question.answer : undefined,
    answers: 'answers' in question ? question.answers : undefined,
  }));

  return (
    <div className={styles['exam-container']}>
      {showModal && (
        <div className={styles['modal']}>
          <div className={styles['modal-content']}>
            <h2>{resultModalData.title}</h2>
            {isPassing ? <p>{resultModalData.messages.pass}</p> : <p>{resultModalData.messages.fail}</p>}
            <button
              onClick={() => {
                setShowModal(false);
                if (!isPassing) {
                  assert(true, '让我们继续我们之前的理想吧');
                }
              }}
            >
              {resultModalData.buttonText}
            </button>
          </div>
        </div>
      )}

      <div className={styles['results-container']}>
        {!showResults ? (
          <div className={styles['loading-results']}>
            <h2>正在计算成绩</h2>
            <div className={styles['circular-progress']}>
              <div
                className={styles['circular-progress-inner']}
                style={{
                  background: `conic-gradient(#0066cc ${progress * 3.6}deg, #f0f7ff 0deg)`,
                }}
              >
                <div className={styles['circular-progress-number']}>{progress}%</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={styles['results-header']}>
              <h1 className={styles['results-title']}>考试完成</h1>
              <p>感谢您完成考试！以下是您的成绩。</p>
            </div>

            <div className={styles['score-container']}>
              <div className={styles['score-circle']}>
                <div className={styles['score-value']}>{percentageScore}%</div>
                <div className={styles['score-label']}>总分</div>
              </div>
            </div>

            <div className={styles['summary-stats']}>
              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>{correctAnswers}</div>
                <div className={styles['stat-label']}>正确</div>
              </div>

              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>{incorrectAnswers}</div>
                <div className={styles['stat-label']}>错误</div>
              </div>

              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>{unanswered}</div>
                <div className={styles['stat-label']}>未回答</div>
              </div>
            </div>

            <ExamResultReviewList questions={reviewQuestions} userAnswers={userAnswers} skipFillBlank />

            <div className={styles['button-group']}>
              <button className={styles['review-button']} onClick={resetExam}>
                重新开始考试
              </button>

              <button
                className={`${styles['review-button']} ${styles['secondary-button']}`}
                onClick={resetToStart}
              >
                回到启动页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamResults;
