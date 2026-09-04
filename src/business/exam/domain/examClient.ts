import type { ExamConfig, ExamTypeDetail } from './types';

export interface ExamClient {
  getExamTypes(): Promise<string[]>;
  getExamTypeDetails(): Promise<ExamTypeDetail[]>;
  getExamMetadata(type: string): Promise<unknown>;
  getExamQuestions(type: string): Promise<{ questions: unknown[] }>;
  getExamConfig(type: string): Promise<ExamConfig>;
  saveExamConfig(type: string, config: ExamConfig): Promise<void>;
}

export class HttpExamClient implements ExamClient {
  async getExamTypes(): Promise<string[]> {
    const response = await fetch('/api/exam/types');
    if (!response.ok) throw new Error('Failed to fetch exam types');
    const data = await response.json();
    return data.examTypes?.map((item: { id: string }) => item.id) ?? [];
  }

  async getExamTypeDetails(): Promise<ExamTypeDetail[]> {
    const response = await fetch('/api/testField/experiment/config/examTypes?details=true');
    if (!response.ok) throw new Error('Failed to fetch exam type details');
    return response.json();
  }

  async getExamMetadata(type: string): Promise<unknown> {
    const response = await fetch(`/api/exam/${encodeURIComponent(type)}/metadata`);
    if (!response.ok) throw new Error('Failed to fetch exam metadata');
    return response.json();
  }

  async getExamQuestions(type: string): Promise<{ questions: unknown[] }> {
    const response = await fetch(`/api/exam/${encodeURIComponent(type)}/questions`);
    if (!response.ok) throw new Error('Failed to fetch exam questions');
    return response.json();
  }

  async getExamConfig(type: string): Promise<ExamConfig> {
    const response = await fetch(`/api/testField/experiment/config/questions?type=${encodeURIComponent(type)}`);
    if (!response.ok) throw new Error('Failed to fetch exam config');
    return response.json();
  }

  async saveExamConfig(type: string, config: ExamConfig): Promise<void> {
    const response = await fetch(`/api/testField/experiment/config/questions?type=${encodeURIComponent(type)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to save exam config');
    }
  }
}
