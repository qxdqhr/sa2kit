import { useState, useCallback } from 'react';
import { Question } from '../../types';

export const useNavigation = (
  questions: Question[], 
  checkQuestionEffect: (index: number) => void
) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // 当前问题
  const currentQuestion = questions[currentQuestionIndex];
  
  // 导航方法
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      checkQuestionEffect(nextIndex);
    }
  }, [currentQuestionIndex, questions.length, checkQuestionEffect]);
  
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      checkQuestionEffect(prevIndex);
    }
  }, [currentQuestionIndex, checkQuestionEffect]);
  
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      checkQuestionEffect(index);
    }
  }, [questions.length, checkQuestionEffect]);
  
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  return {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    currentQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    isFirstQuestion,
    isLastQuestion
  };
}; 