import type { Question, StartScreenData, ResultModalData } from '../types';
import { ExamConfigFrontendService, HttpExamClient } from '../../../domain';
import type { ExamConfig } from '../../../domain';
import {
  mockQuestions,
  mockStartScreenData,
  mockResultModalData,
} from '../utils/mockData';

export type ExamConfigData = {
  questions: Question[];
  startScreen: StartScreenData;
  resultModal: ResultModalData;
};

const examConfigService = new ExamConfigFrontendService(new HttpExamClient());

export async function listExamTypes(): Promise<string[]> {
  try {
    return await examConfigService.listTypes();
  } catch (error) {
    console.error('加载试卷类型列表失败:', error);
    return ['default'];
  }
}

export async function loadExamConfigurations(
  examId = 'default',
): Promise<ExamConfigData> {
  try {
    return (await examConfigService.load(examId)) as unknown as ExamConfigData;
  } catch (error) {
    console.error('加载配置失败:', error);
    return {
      questions: mockQuestions,
      startScreen: mockStartScreenData,
      resultModal: mockResultModalData,
    };
  }
}

export async function saveExamConfigurations(
  config: ExamConfigData,
  examId = 'default',
): Promise<void> {
  await examConfigService.save(examId, config as unknown as ExamConfig);
}
