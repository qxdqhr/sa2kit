import { Question } from './questions';

// 答题页数据结构
export interface ExamData {
  title: string;
  questions: Question[];
}

// 启动页数据结构
export interface StartScreenData {
  title: string;
  description: string;
  rules: {
    title: string;
    items: string[];
  };
  buttonText: string;
}

// 结果页弹窗数据结构
export interface ResultModalData {
  title: string;
  showDelayTime: number; // 显示弹窗的延迟时间（毫秒）
  messages: {
    pass: string; // 及格时显示的消息
    fail: string; // 不及格时显示的消息
  };
  buttonText: string;
  passingScore: number; // 及格分数线（百分比）
} 