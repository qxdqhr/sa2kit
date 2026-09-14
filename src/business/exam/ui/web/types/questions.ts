import { QuestionType } from './enums';
import { SpecialEffect } from './effects';

// 基础题目接口
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  content: string;
  imageUrl?: string;
  audioUrl?: string; // 音频URL
  score: number;
  specialEffect?: SpecialEffect; 
}

// 选择题选项
export interface Option {
  id: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string; // 选项音频URL
}

// 单选题
export interface SingleChoiceQuestion extends BaseQuestion {
  type: QuestionType.SingleChoice;
  options: Option[];
  answer: string; // 正确选项的id
}

// 多选题
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MultipleChoice;
  options: Option[];
  answers: string[]; // 正确选项的id数组
}

// 填空题
export interface FillBlankQuestion extends BaseQuestion {
  type: QuestionType.FillBlank;
  answers: string[];
}

// 简答题
export interface ShortAnswerQuestion extends BaseQuestion {
  type: QuestionType.ShortAnswer;
  answer: string;
}

// 论述题
export interface EssayQuestion extends BaseQuestion {
  type: QuestionType.Essay;
  answer: string;
}

// 题目类型联合
export type Question = 
  | SingleChoiceQuestion 
  | MultipleChoiceQuestion 
  | FillBlankQuestion 
  | ShortAnswerQuestion 
  | EssayQuestion;

// 用户答案类型
export interface UserAnswer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
} 