import { eq, sql } from 'drizzle-orm';
import type { ExamQueryDataSource, ExamTypeAdminRepository } from './types';

export function createExamQueryService(dataSource: ExamQueryDataSource) {
  return {
    fetchExamTypes: () => dataSource.getAllExamTypes(),
    fetchExamMetadata: (type: string) => dataSource.getExamMetadata(type),
    fetchExamQuestions: (type: string) => dataSource.getExamQuestions(type),
    fetchFullExamConfig: (type: string) => dataSource.getFullExamConfig(type),
    saveExamConfig: (type: string, config: unknown) => dataSource.saveFullExamConfig(type, config),
  };
}

export function createExamTypeAdminService(
  repository: ExamTypeAdminRepository,
  options?: { protectedExamTypes?: string[] }
) {
  const protectedTypes = new Set(options?.protectedExamTypes || ['default', 'arknights']);

  return {
    async listExamTypeIds() {
      const types = await repository.listExamTypes();
      return types.map((type) => type.id);
    },

    async listExamTypeDetails() {
      const types = await repository.listExamTypes();

      return Promise.all(
        types.map(async (type) => {
          const metadataRows = await repository.findExamMetadata(type.id);
          const metadata = metadataRows[0] || {
            id: type.id,
            name: type.id,
            description: '',
            createdAt: new Date(),
            lastModified: new Date(),
          };

          const countRows = await repository.countExamQuestions(type.id);
          const questionCount = countRows[0]?.count || 0;

          return {
            ...metadata,
            questionCount,
          };
        })
      );
    },

    async createExamType(input: { id: string; name: string; description?: string }) {
      if (!input.id || !input.name) throw new Error('INVALID_PAYLOAD');
      if (!/^[a-z0-9_-]+$/.test(input.id)) throw new Error('INVALID_ID_FORMAT');

      const existingType = await repository.findExamType(input.id);
      if (existingType.length > 0) throw new Error('EXAM_TYPE_EXISTS');

      await repository.createExamTypeWithMetadata(input);

      return {
        id: input.id,
        name: input.name,
        description: input.description || '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
    },

    async deleteExamType(typeId: string) {
      if (!typeId) throw new Error('MISSING_TYPE_ID');
      if (protectedTypes.has(typeId)) throw new Error('PROTECTED_EXAM_TYPE');

      const existingType = await repository.findExamType(typeId);
      if (existingType.length === 0) throw new Error('EXAM_TYPE_NOT_FOUND');

      await repository.deleteExamTypeCascade(typeId);
    },

    async updateExamType(input: { id: string; name: string; description?: string }) {
      if (!input.id || !input.name) throw new Error('INVALID_PAYLOAD');

      const existingType = await repository.findExamType(input.id);
      if (existingType.length === 0) throw new Error('EXAM_TYPE_NOT_FOUND');

      await repository.updateExamTypeMetadata(input);

      return {
        id: input.id,
        name: input.name,
        description: input.description || '',
        lastModified: new Date().toISOString(),
      };
    },
  };
}

type DrizzleDbLike = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  transaction: (fn: (tx: any) => Promise<any>) => Promise<any>;
};

type ExamSchema = {
  examTypes: any;
  examMetadata: any;
  examQuestions: any;
  examStartScreens: any;
  examResultModals: any;
};

export function createExamDrizzleRepository(args: { db: DrizzleDbLike; schema: ExamSchema }) {
  const { db, schema } = args;
  const { examTypes, examMetadata, examQuestions, examStartScreens, examResultModals } = schema;

  return {
    async listExamTypes() {
      return db.select().from(examTypes);
    },

    async findExamType(typeId: string) {
      return db.select().from(examTypes).where(eq(examTypes.id, typeId));
    },

    async findExamMetadata(typeId: string) {
      return db.select().from(examMetadata).where(eq(examMetadata.id, typeId));
    },

    async countExamQuestions(typeId: string) {
      return db
        .select({ count: sql<number>`count(*)` })
        .from(examQuestions)
        .where(eq(examQuestions.examTypeId, typeId));
    },

    async createExamTypeWithMetadata(input: { id: string; name: string; description?: string }) {
      const now = new Date();
      await db.transaction(async (tx: any) => {
        await tx.insert(examTypes).values({
          id: input.id,
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(examMetadata).values({
          id: input.id,
          name: input.name,
          description: input.description || '',
          createdAt: now,
          lastModified: now,
        });
      });
    },

    async updateExamTypeMetadata(input: { id: string; name: string; description?: string }) {
      await db
        .update(examMetadata)
        .set({
          name: input.name,
          description: input.description || '',
          lastModified: new Date(),
        })
        .where(eq(examMetadata.id, input.id));
    },

    async deleteExamTypeCascade(typeId: string) {
      await db.transaction(async (tx: any) => {
        await tx.delete(examQuestions).where(eq(examQuestions.examTypeId, typeId));
        await tx.delete(examStartScreens).where(eq(examStartScreens.id, typeId));
        await tx.delete(examResultModals).where(eq(examResultModals.id, typeId));
        await tx.delete(examMetadata).where(eq(examMetadata.id, typeId));
        await tx.delete(examTypes).where(eq(examTypes.id, typeId));
      });
    },

    async getAllExamTypes() {
      return db.select().from(examTypes);
    },

    async getExamMetadata(type: string) {
      const metadata = await db.select().from(examMetadata).where(eq(examMetadata.id, type));
      if (metadata.length === 0) throw new Error(`EXAM_METADATA_NOT_FOUND:${type}`);
      return metadata[0];
    },

    async getExamQuestions(type: string) {
      const questions = await db.select().from(examQuestions).where(eq(examQuestions.examTypeId, type));
      return { questions };
    },

    async getExamStartScreen(type: string) {
      const startScreen = await db.select().from(examStartScreens).where(eq(examStartScreens.id, type));
      return startScreen[0] || null;
    },

    async getExamResultModal(type: string) {
      const resultModal = await db.select().from(examResultModals).where(eq(examResultModals.id, type));
      return resultModal[0] || null;
    },

    async getFullExamConfig(type: string) {
      const questions = await db.select().from(examQuestions).where(eq(examQuestions.examTypeId, type));
      const startScreenRows = await db.select().from(examStartScreens).where(eq(examStartScreens.id, type));
      const resultModalRows = await db.select().from(examResultModals).where(eq(examResultModals.id, type));

      let startScreen = startScreenRows[0] || null;
      let resultModal = resultModalRows[0] || null;

      if (!startScreen) {
        startScreen = {
          id: type,
          title: '考试标题',
          description: '考试描述',
          rules: {
            title: '考试须知：',
            items: ['请仔细阅读题目', '遵守考试规则'],
          },
          buttonText: '开始答题',
          updatedAt: new Date(),
        };
      }

      if (!resultModal) {
        resultModal = {
          id: type,
          title: '考试结果',
          showDelayTime: 3000,
          messages: {
            pass: '恭喜通过考试！',
            fail: '很遗憾，未通过考试。',
          },
          buttonText: '关闭',
          passingScore: 60,
          updatedAt: new Date(),
        };
      }

      return {
        questions,
        startScreen,
        resultModal,
      };
    },

    async saveFullExamConfig(type: string, config: any) {
      await db.transaction(async (tx: any) => {
        await tx.delete(examQuestions).where(eq(examQuestions.examTypeId, type));

        if (Array.isArray(config?.questions)) {
          for (const question of config.questions) {
            await tx.insert(examQuestions).values({
              examTypeId: type,
              questionId: question.id,
              content: question.content,
              type: question.type,
              options: question.options,
              answer: question.answer || null,
              answers: question.answers || null,
              score: question.score || 1,
              audioUrl: question.audioUrl || null,
              specialEffect: question.specialEffect || null,
            });
          }
        }

        if (config?.startScreen) {
          const startScreen = config.startScreen;
          const existingStartScreen = await tx
            .select()
            .from(examStartScreens)
            .where(eq(examStartScreens.id, type));

          if (existingStartScreen.length > 0) {
            await tx
              .update(examStartScreens)
              .set({
                title: startScreen.title,
                description: startScreen.description,
                rules: startScreen.rules,
                buttonText: startScreen.buttonText,
                updatedAt: new Date(),
              })
              .where(eq(examStartScreens.id, type));
          } else {
            await tx.insert(examStartScreens).values({
              id: type,
              title: startScreen.title,
              description: startScreen.description,
              rules: startScreen.rules,
              buttonText: startScreen.buttonText,
              updatedAt: new Date(),
            });
          }
        }

        if (config?.resultModal) {
          const resultModal = config.resultModal;
          const existingResultModal = await tx
            .select()
            .from(examResultModals)
            .where(eq(examResultModals.id, type));

          if (existingResultModal.length > 0) {
            await tx
              .update(examResultModals)
              .set({
                title: resultModal.title,
                showDelayTime: resultModal.showDelayTime,
                messages: resultModal.messages,
                buttonText: resultModal.buttonText,
                passingScore: resultModal.passingScore,
                updatedAt: new Date(),
              })
              .where(eq(examResultModals.id, type));
          } else {
            await tx.insert(examResultModals).values({
              id: type,
              title: resultModal.title,
              showDelayTime: resultModal.showDelayTime,
              messages: resultModal.messages,
              buttonText: resultModal.buttonText,
              passingScore: resultModal.passingScore,
              updatedAt: new Date(),
            });
          }
        }

        await tx
          .update(examMetadata)
          .set({ lastModified: new Date() })
          .where(eq(examMetadata.id, type));
      });
    },
  };
}

export function createExamServices(args: {
  db: DrizzleDbLike;
  schema: ExamSchema;
  protectedExamTypes?: string[];
}) {
  const repository = createExamDrizzleRepository({ db: args.db, schema: args.schema });

  const queryService = createExamQueryService({
    getAllExamTypes: repository.getAllExamTypes,
    getExamMetadata: repository.getExamMetadata,
    getExamQuestions: repository.getExamQuestions,
    getFullExamConfig: repository.getFullExamConfig,
    saveFullExamConfig: repository.saveFullExamConfig,
  });

  const adminService = createExamTypeAdminService(repository, {
    protectedExamTypes: args.protectedExamTypes,
  });

  return {
    repository,
    queryService,
    adminService,
  };
}
