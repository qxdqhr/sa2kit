export enum ExamQuestionType {
  SingleChoice = 'single_choice',
  MultipleChoice = 'multiple_choice',
  FillBlank = 'fill_blank',
  ShortAnswer = 'short_answer',
  Essay = 'essay',
}

export interface ExamOption {
  id: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface BaseExamQuestion {
  id: string;
  type: ExamQuestionType;
  content: string;
  score: number;
  imageUrl?: string;
  audioUrl?: string;
  specialEffect?: unknown;
}

export interface SingleChoiceExamQuestion extends BaseExamQuestion {
  type: ExamQuestionType.SingleChoice;
  options: ExamOption[];
  answer: string;
}

export interface MultipleChoiceExamQuestion extends BaseExamQuestion {
  type: ExamQuestionType.MultipleChoice;
  options: ExamOption[];
  answers: string[];
}

export type SelectionExamQuestion = SingleChoiceExamQuestion | MultipleChoiceExamQuestion;

export type ExamQuestion = SelectionExamQuestion | BaseExamQuestion;

export interface ExamUserAnswer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
}

export interface ExamScoreSummary {
  score: number;
  totalPoints: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
}

export interface ExamStartScreen {
  title: string;
  description: string;
  rules: {
    title: string;
    items: string[];
  };
  buttonText: string;
}

export interface ExamResultModal {
  title: string;
  showDelayTime: number;
  messages: {
    pass: string;
    fail: string;
  };
  buttonText: string;
  passingScore: number;
}

export interface ExamConfig {
  questions: ExamQuestion[];
  startScreen: ExamStartScreen;
  resultModal: ExamResultModal;
}

export interface ExamTypeDetail {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  lastModified: Date;
  questionCount: number;
}
