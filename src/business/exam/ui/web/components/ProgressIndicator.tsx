"use client";

import { useExam } from '../context';
import styles from '../styles';

const ProgressIndicator = () => {
  const { currentQuestionIndex, totalQuestions, questionsAnswered } = useExam();
  
  // 计算完成百分比
  const percentage = Math.round((currentQuestionIndex + 1) / totalQuestions * 100);
  
  // 计算已回答的问题百分比
  const answeredPercentage = Math.round((questionsAnswered.length / totalQuestions) * 100);
  
  return (
    <div className={styles["progress-container"]}>
      <div className={styles["progress-bar"]}>
        <div 
          className={styles["progress-fill"]}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className={styles["progress-text"]}>
        <span>当前进度: {percentage}%</span>
        <span>已回答: {answeredPercentage}%</span>
      </div>
    </div>
  );
};

export default ProgressIndicator; 