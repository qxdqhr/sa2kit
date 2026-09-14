'use client';

/**
 * exam Web UI — `sa2kit/business/exam/ui/web`
 * 答卷页 + 配置台已下沉；宿主仅薄 page。
 */

export * from '../contracts';
export { webExamAdapter } from './WebExamAdapter';
export { ExamResultReviewList } from './ExamResultReviewList';
export { default as ExamPage } from './pages/ExamPage';
export { default as ExamConfigPage } from './pages/ExamConfigPage';
export type * from './types';
export type { ConfigData } from './config/types';
export { EXAM_TYPE_MAP, QuestionType, SpecialEffectType } from './config/types';
export {
  listExamTypes,
  loadExamConfigurations,
  saveExamConfigurations,
} from './services/loadExamConfig';
export type { ExamConfigData } from './services/loadExamConfig';
export {
  mockQuestions,
  mockStartScreenData,
  mockResultModalData,
} from './utils/mockData';
export {
  loadConfigurations,
  saveConfigurations,
  exportConfigurations,
  importConfigurations,
} from './config/services/configManagement';
