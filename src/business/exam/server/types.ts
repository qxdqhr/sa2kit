export interface ExamQueryDataSource {
  getAllExamTypes(): Promise<Array<{ id: string }>>;
  getExamMetadata(type: string): Promise<unknown>;
  getExamQuestions(type: string): Promise<{ questions: unknown[] }>;
  getFullExamConfig(type: string): Promise<unknown>;
  saveFullExamConfig(type: string, config: unknown): Promise<unknown>;
}

export interface ExamTypeAdminRepository {
  listExamTypes(): Promise<Array<{ id: string }>>;
  findExamType(typeId: string): Promise<Array<{ id: string }>>;
  findExamMetadata(typeId: string): Promise<Array<{ id: string; name: string; description: string; createdAt: Date; lastModified: Date }>>;
  countExamQuestions(typeId: string): Promise<Array<{ count: number }>>;
  createExamTypeWithMetadata(input: { id: string; name: string; description?: string }): Promise<void>;
  updateExamTypeMetadata(input: { id: string; name: string; description?: string }): Promise<void>;
  deleteExamTypeCascade(typeId: string): Promise<void>;
}
