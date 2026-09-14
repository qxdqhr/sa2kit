"use client";

import { useExam } from '../context';
import QuestionTypeTag from './QuestionTypeTag';

const QuestionHeader = () => {
  const { currentQuestion } = useExam();
  
  return (
    <div className="question-header">
      <div className="score-text">
        得分：{currentQuestion.score}分
      </div>
      <QuestionTypeTag />
    </div>
  );
};

export default QuestionHeader; 