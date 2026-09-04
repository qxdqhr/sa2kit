import type { ExamClient } from './examClient';
import type { ExamConfig } from './types';

export class ExamConfigFrontendService {
  constructor(private readonly client: ExamClient) {}

  async load(type = 'default'): Promise<ExamConfig> {
    return this.client.getExamConfig(type);
  }

  async save(type: string, config: ExamConfig): Promise<void> {
    await this.client.saveExamConfig(type, config);
  }

  async listTypes(): Promise<string[]> {
    return this.client.getExamTypes();
  }
}
