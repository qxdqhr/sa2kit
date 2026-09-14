import { 
  Question,
  UserAnswer, 
  ModalPopEffect,
  StartScreenData,
  ResultModalData
} from "../types";

// 导出上下文类型定义
export interface ExamContextType {
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question;
  userAnswers: UserAnswer[];
  questionsAnswered: string[];
  totalQuestions: number;
  examSubmitted: boolean;
  isMobile: boolean;
  examStarted: boolean;
  specialModalOpen: boolean;
  specialModalData: ModalPopEffect | null;
  textShakeEffect: boolean;
  textFlashEffect: boolean;
  startScreenData: StartScreenData;
  resultModalData: ResultModalData;
  
  // 导航方法
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (index: number) => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  
  // 回答问题方法
  handleSingleChoiceAnswer: (questionId: string, optionId: string) => void;
  handleMultipleChoiceAnswer: (questionId: string, optionId: string, isSelected: boolean) => void;
  handleTextAnswer: (questionId: string, text: string) => void;
  isOptionSelected: (optionId: string) => boolean;
  
  // 提交和重置考试
  handleSubmitExam: () => void;
  resetExam: () => void;
  resetToStart: () => void;
  
  // 计算得分
  calculateScore: () => {
    score: number;
    totalPoints: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
  };
  
  // 开始考试
  startExam: () => void;
  
  // 特殊弹窗相关方法
  closeSpecialModal: () => void;
} 