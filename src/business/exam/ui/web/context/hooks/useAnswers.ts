import { useState, useCallback } from 'react';
import { UserAnswer, Question } from '../../types';

export const useAnswers = (currentQuestion: Question) => {
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  
  // 已回答的问题ID列表
  const questionsAnswered = userAnswers.map(answer => answer.questionId);
  
  // 单选题答案处理
  const handleSingleChoiceAnswer = useCallback((questionId: string, optionId: string) => {
    setUserAnswers(prevAnswers => {
      // 检查是否已经有这个问题的答案
      const existingAnswerIndex = prevAnswers.findIndex(
        answer => answer.questionId === questionId
      );
      
      if (existingAnswerIndex !== -1) {
        // 更新现有答案
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = {
          ...updatedAnswers[existingAnswerIndex],
          selectedOptions: [optionId]
        };
        return updatedAnswers;
      } else {
        // 添加新答案
        return [...prevAnswers, {
          questionId,
          selectedOptions: [optionId]
        }];
      }
    });
  }, []);
  
  // 多选题答案处理
  const handleMultipleChoiceAnswer = useCallback((
    questionId: string, 
    optionId: string, 
    isSelected: boolean
  ) => {
    setUserAnswers(prevAnswers => {
      // 检查是否已经有这个问题的答案
      const existingAnswerIndex = prevAnswers.findIndex(
        answer => answer.questionId === questionId
      );
      
      if (existingAnswerIndex !== -1) {
        // 获取现有答案
        const existingAnswer = prevAnswers[existingAnswerIndex];
        let updatedOptions: string[];
        
        if (isSelected) {
          // 添加选项
          updatedOptions = [...existingAnswer.selectedOptions, optionId];
        } else {
          // 移除选项
          updatedOptions = existingAnswer.selectedOptions.filter(id => id !== optionId);
        }
        
        // 更新答案数组
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = {
          ...existingAnswer,
          selectedOptions: updatedOptions
        };
        
        return updatedAnswers;
      } else {
        // 添加新答案
        return [...prevAnswers, {
          questionId,
          selectedOptions: isSelected ? [optionId] : []
        }];
      }
    });
  }, []);
  
  // 文本答案处理
  const handleTextAnswer = useCallback((questionId: string, text: string) => {
    setUserAnswers(prevAnswers => {
      const existingAnswerIndex = prevAnswers.findIndex(
        answer => answer.questionId === questionId
      );
      
      if (existingAnswerIndex !== -1) {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = {
          ...updatedAnswers[existingAnswerIndex],
          textAnswer: text,
          selectedOptions: [] // 文本类型答案没有选项
        };
        return updatedAnswers;
      } else {
        return [...prevAnswers, {
          questionId,
          selectedOptions: [],
          textAnswer: text
        }];
      }
    });
  }, []);
  
  // 检查某个选项是否被选中
  const isOptionSelected = useCallback((optionId: string) => {
    const currentQuestionAnswer = userAnswers.find(
      answer => answer.questionId === currentQuestion.id
    );
    
    return currentQuestionAnswer 
      ? currentQuestionAnswer.selectedOptions.includes(optionId)
      : false;
  }, [currentQuestion.id, userAnswers]);
  
  return {
    userAnswers,
    setUserAnswers,
    questionsAnswered,
    handleSingleChoiceAnswer,
    handleMultipleChoiceAnswer,
    handleTextAnswer,
    isOptionSelected
  };
}; 