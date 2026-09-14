'use client';

/**
 * exam Web UI — `sa2kit/business/exam/ui/web`
 * 答卷页已下沉；配置台仍在宿主 `/testField/experiment/config`。
 */

export * from '../contracts';
export { webExamAdapter } from './WebExamAdapter';
export { ExamResultReviewList } from './ExamResultReviewList';
export { default as ExamPage } from './pages/ExamPage';
export type * from './types';
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
