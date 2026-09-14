import { useState, useCallback } from 'react';

export const useExamState = () => {
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  
  // 提交考试
  const handleSubmitExam = useCallback(() => {
    setExamSubmitted(true);
  }, []);
  
  // 重置考试
  const resetExam = useCallback(() => {
    setExamSubmitted(false);
  }, []);
  
  // 重置到启动页
  const resetToStart = useCallback(() => {
    setExamSubmitted(false);
    setExamStarted(false);
  }, []);
  
  // 开始考试
  const startExam = useCallback(() => {
    setExamStarted(true);
  }, []);
  
  return {
    examSubmitted,
    examStarted,
    handleSubmitExam,
    resetExam,
    resetToStart,
    startExam
  };
}; 