"use client";

import { useExam } from '../context';
import { QuestionType } from '../types';

const QuestionTypeTag = () => {
  const { currentQuestion } = useExam();
  
  let typeText = "";
  let tagClass = "";
  
  switch (currentQuestion.type) {
    case QuestionType.SingleChoice:
      typeText = "单选题";
      tagClass = "tag-single";
      break;
    case QuestionType.MultipleChoice:
      typeText = "多选题";
      tagClass = "tag-multiple";
      break;
    default:
      return null;
  }
  
  return (
    <span className={`tag ${tagClass}`}>
      {typeText}
    </span>
  );
};

export default QuestionTypeTag; 