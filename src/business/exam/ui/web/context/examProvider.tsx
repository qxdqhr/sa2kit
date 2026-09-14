"use client";

import React, { useEffect } from "react";
import { Question, StartScreenData, ResultModalData } from "../types";
import ExamContext from "./examContext";
import { useDevice } from "./hooks/useDevice";
import { useExamState } from "./hooks/useExamState";
import { useNavigation } from "./hooks/useNavigation";
import { useSpecialEffects } from "./hooks/useSpecialEffects";
import { useAnswers } from "./hooks/useAnswers";
import { useScoring } from "./hooks/useScoring";

// 提供者组件
interface ExamProviderProps {
  children: React.ReactNode;
  initialQuestions: Question[];
  startScreenData: StartScreenData;
  resultModalData: ResultModalData;
}

export const ExamProvider: React.FC<ExamProviderProps> = ({ 
  children, 
  initialQuestions,
  startScreenData,
  resultModalData
}) => {
  // 获取各个钩子的状态和方法
  const { isMobile } = useDevice();
  
  const {
    examSubmitted,
    examStarted,
    handleSubmitExam,
    resetExam,
    resetToStart,
    startExam
  } = useExamState();
  
  const {
    specialModalOpen,
    specialModalData,
    textShakeEffect,
    textFlashEffect,
    checkQuestionEffect,
    closeSpecialModal
  } = useSpecialEffects();
  
  // 包装checkQuestionEffect，传递questions参数
  const wrappedCheckQuestionEffect = (index: number) => {
    checkQuestionEffect(index, initialQuestions);
  };
  
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    currentQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    isFirstQuestion,
    isLastQuestion
  } = useNavigation(initialQuestions, wrappedCheckQuestionEffect);
  
  const {
    userAnswers,
    setUserAnswers,
    questionsAnswered,
    handleSingleChoiceAnswer,
    handleMultipleChoiceAnswer,
    handleTextAnswer,
    isOptionSelected
  } = useAnswers(currentQuestion);
  
  const { calculateScore } = useScoring(initialQuestions, userAnswers);
  
  // 初始检查第一题是否有特效
  useEffect(() => {
    if (examStarted && initialQuestions.length > 0) {
      wrappedCheckQuestionEffect(currentQuestionIndex);
    }
  }, [examStarted, initialQuestions, currentQuestionIndex]);
  
  // 提供上下文值
  const contextValue = {
    questions: initialQuestions,
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    questionsAnswered,
    totalQuestions: initialQuestions.length,
    examSubmitted,
    isMobile,
    examStarted,
    specialModalOpen,
    specialModalData,
    textShakeEffect,
    textFlashEffect,
    startScreenData,
    resultModalData,
    
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    isFirstQuestion,
    isLastQuestion,
    
    handleSingleChoiceAnswer,
    handleMultipleChoiceAnswer,
    handleTextAnswer,
    isOptionSelected,
    
    handleSubmitExam,
    resetExam,
    resetToStart,
    calculateScore,
    startExam,
    closeSpecialModal
  };
  
  return (
    <ExamContext.Provider value={contextValue}>
      {children}
    </ExamContext.Provider>
  );
}; 