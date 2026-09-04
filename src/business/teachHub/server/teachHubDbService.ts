import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import type {
  CreateWorkspaceInput,
  LessonIndex,
  TeachGenerateJob,
  TeachLessonProgress,
  TeachWorkspace,
  TeachWorkspaceSummary,
  UpdateProgressInput,
  WorkspaceStatus,
} from '../domain';
import { teachGenerateJobs, teachLessonProgress, teachWorkspaces } from './schema';
import { slugifyTitle } from './paths';
import {
  buildWorkspaceMeta,
  composeMissionMarkdown,
  DEFAULT_NOTES_MD,
  DEFAULT_RESOURCES_MD,
  formatTeachHubStorageError,
} from './templates';

export type DrizzleLikeDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

export type InitEmptyWorkspaceFilesInput = {
  userId: string;
  workspaceId: string;
  title: string;
  topic: string | null;
  missionMarkdown: string;
  resourcesMarkdown: string;
  notesMarkdown: string;
  metaJson: ReturnType<typeof buildWorkspaceMeta>;
};

export type TeachHubFileStoreAdapter = {
  initEmptyWorkspaceFiles: (input: InitEmptyWorkspaceFilesInput) => Promise<void>;
  listWorkspaceLessons: (userId: string, workspaceId: string) => Promise<LessonIndex[]>;
  repairWorkspaceSeedFilesIfMissing?: (
    userId: string,
    workspace: TeachWorkspace,
  ) => Promise<void>;
};

export type TeachHubDbServiceOptions = {
  fileStore: TeachHubFileStoreAdapter;
  formatStorageError?: (error: unknown) => string;
};

function mapWorkspace(row: typeof teachWorkspaces.$inferSelect): TeachWorkspace {
  return {
    id: row.id,
    userId: row.userId,
    slug: row.slug,
    title: row.title,
    topic: row.topic,
    status: row.status as WorkspaceStatus,
    missionSummary: row.missionSummary,
    lessonCount: row.lessonCount,
    lastLessonSlug: row.lastLessonSlug,
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapProgress(row: typeof teachLessonProgress.$inferSelect): TeachLessonProgress {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    lessonSlug: row.lessonSlug,
    lessonOrder: row.lessonOrder,
    status: row.status as TeachLessonProgress['status'],
    quizScore: row.quizScore,
    quizTotal: row.quizTotal,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
  };
}

function mapGenerateJob(row: typeof teachGenerateJobs.$inferSelect): TeachGenerateJob {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    trigger: row.trigger as TeachGenerateJob['trigger'],
    status: row.status as TeachGenerateJob['status'],
    inputSnapshot: (row.inputSnapshot as Record<string, unknown> | null) ?? null,
    outputFiles: Array.isArray(row.outputFiles) ? (row.outputFiles as string[]) : null,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

export class TeachHubDbService {
  private readonly formatStorageError: (error: unknown) => string;

  constructor(
    private readonly db: DrizzleLikeDb,
    private readonly options: TeachHubDbServiceOptions,
  ) {
    this.formatStorageError = options.formatStorageError ?? formatTeachHubStorageError;
  }

  private async ensureUniqueSlug(userId: string, baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await this.db
        .select({ id: teachWorkspaces.id })
        .from(teachWorkspaces)
        .where(and(eq(teachWorkspaces.userId, userId), eq(teachWorkspaces.slug, slug)))
        .limit(1);
      if (!existing.length) return slug;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  async listWorkspacesByUser(userId: string): Promise<TeachWorkspaceSummary[]> {
    const rows = await this.db
      .select()
      .from(teachWorkspaces)
      .where(eq(teachWorkspaces.userId, userId))
      .orderBy(desc(teachWorkspaces.lastOpenedAt), desc(teachWorkspaces.updatedAt));

    const summaries: TeachWorkspaceSummary[] = [];
    for (const row of rows) {
      const completed = await this.db
        .select({ id: teachLessonProgress.id })
        .from(teachLessonProgress)
        .where(
          and(
            eq(teachLessonProgress.workspaceId, row.id),
            eq(teachLessonProgress.status, 'completed'),
          ),
        );
      summaries.push({
        ...mapWorkspace(row),
        completedLessonCount: completed.length,
      });
    }
    return summaries;
  }

  async getWorkspaceForUser(
    userId: string,
    workspaceId: string,
  ): Promise<TeachWorkspace | null> {
    const rows = await this.db
      .select()
      .from(teachWorkspaces)
      .where(and(eq(teachWorkspaces.id, workspaceId), eq(teachWorkspaces.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? mapWorkspace(row) : null;
  }

  async assertWorkspaceForUser(userId: string, workspaceId: string): Promise<TeachWorkspace> {
    const workspace = await this.getWorkspaceForUser(userId, workspaceId);
    if (!workspace) {
      throw new Error('工作区不存在或无权访问');
    }
    return workspace;
  }

  async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput,
  ): Promise<TeachWorkspace> {
    const workspaceId = randomUUID();
    const baseSlug = slugifyTitle(input.title);
    const slug = await this.ensureUniqueSlug(userId, baseSlug);
    const missionMarkdown = composeMissionMarkdown({
      why: input.missionDraft?.why ?? '',
      successLooksLike: input.missionDraft?.successLooksLike,
      constraints: input.missionDraft?.constraints,
      outOfScope: input.missionDraft?.outOfScope,
    });
    const missionSummary =
      input.missionDraft?.why?.trim() || '（请填写你学习这个主题的原因）';

    const now = new Date();
    await this.db.insert(teachWorkspaces).values({
      id: workspaceId,
      userId,
      slug,
      title: input.title.trim(),
      topic: input.topic?.trim() || null,
      status: 'active',
      missionSummary,
      lessonCount: 0,
      lastLessonSlug: null,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await this.options.fileStore.initEmptyWorkspaceFiles({
        userId,
        workspaceId,
        title: input.title.trim(),
        topic: input.topic ?? null,
        missionMarkdown,
        resourcesMarkdown: DEFAULT_RESOURCES_MD,
        notesMarkdown: DEFAULT_NOTES_MD,
        metaJson: buildWorkspaceMeta({
          title: input.title.trim(),
          topic: input.topic ?? null,
        }),
      });
    } catch (error) {
      await this.db.delete(teachWorkspaces).where(eq(teachWorkspaces.id, workspaceId));
      throw new Error(this.formatStorageError(error));
    }

    const created = await this.getWorkspaceForUser(userId, workspaceId);
    if (!created) {
      throw new Error('创建工作区失败');
    }
    return created;
  }

  async touchWorkspaceOpened(userId: string, workspaceId: string): Promise<void> {
    await this.db
      .update(teachWorkspaces)
      .set({ lastOpenedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(teachWorkspaces.id, workspaceId), eq(teachWorkspaces.userId, userId)));
  }

  async updateWorkspaceMeta(
    userId: string,
    workspaceId: string,
    patch: {
      title?: string;
      status?: WorkspaceStatus;
      missionSummary?: string | null;
      lessonCount?: number;
      lastLessonSlug?: string | null;
    },
  ): Promise<TeachWorkspace> {
    await this.db
      .update(teachWorkspaces)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(and(eq(teachWorkspaces.id, workspaceId), eq(teachWorkspaces.userId, userId)));

    const updated = await this.getWorkspaceForUser(userId, workspaceId);
    if (!updated) throw new Error('更新工作区失败');
    return updated;
  }

  async syncWorkspaceLessonCache(userId: string, workspaceId: string): Promise<void> {
    const lessons = await this.options.fileStore.listWorkspaceLessons(userId, workspaceId);
    const last = lessons[lessons.length - 1];
    await this.updateWorkspaceMeta(userId, workspaceId, {
      lessonCount: lessons.length,
      lastLessonSlug: last?.slug ?? null,
    });
  }

  async listLessonProgress(
    userId: string,
    workspaceId: string,
  ): Promise<TeachLessonProgress[]> {
    await this.assertWorkspaceForUser(userId, workspaceId);
    const rows = await this.db
      .select()
      .from(teachLessonProgress)
      .where(eq(teachLessonProgress.workspaceId, workspaceId))
      .orderBy(teachLessonProgress.lessonOrder);
    return rows.map(mapProgress);
  }

  async ensureLessonProgressRows(
    userId: string,
    workspaceId: string,
  ): Promise<TeachLessonProgress[]> {
    await this.assertWorkspaceForUser(userId, workspaceId);
    const lessons = await this.options.fileStore.listWorkspaceLessons(userId, workspaceId);
    const existing = await this.listLessonProgress(userId, workspaceId);
    const existingSlugs = new Set(existing.map((p) => p.lessonSlug));

    for (const lesson of lessons) {
      if (existingSlugs.has(lesson.slug)) continue;
      await this.db.insert(teachLessonProgress).values({
        id: randomUUID(),
        userId,
        workspaceId,
        lessonSlug: lesson.slug,
        lessonOrder: lesson.order,
        status: 'available',
        quizScore: null,
        quizTotal: null,
        startedAt: null,
        completedAt: null,
        nextReviewAt: null,
      });
    }

    return this.listLessonProgress(userId, workspaceId);
  }

  async upsertLessonProgress(
    userId: string,
    workspaceId: string,
    input: UpdateProgressInput,
  ): Promise<TeachLessonProgress> {
    await this.assertWorkspaceForUser(userId, workspaceId);
    await this.ensureLessonProgressRows(userId, workspaceId);

    const rows = await this.db
      .select()
      .from(teachLessonProgress)
      .where(
        and(
          eq(teachLessonProgress.workspaceId, workspaceId),
          eq(teachLessonProgress.lessonSlug, input.lessonSlug),
        ),
      )
      .limit(1);

    const now = new Date();
    const row = rows[0];
    if (!row) {
      throw new Error(`课时不存在: ${input.lessonSlug}`);
    }

    const patch: Partial<typeof teachLessonProgress.$inferInsert> = {
      status: input.status,
      quizScore: input.quizScore ?? row.quizScore,
      quizTotal: input.quizTotal ?? row.quizTotal,
    };
    if (input.status === 'in_progress' && !row.startedAt) {
      patch.startedAt = now;
    }
    if (input.status === 'completed') {
      patch.completedAt = now;
    }

    await this.db
      .update(teachLessonProgress)
      .set(patch)
      .where(eq(teachLessonProgress.id, row.id));

    const updated = await this.db
      .select()
      .from(teachLessonProgress)
      .where(eq(teachLessonProgress.id, row.id))
      .limit(1);
    return mapProgress(updated[0]);
  }

  async archiveWorkspace(userId: string, workspaceId: string): Promise<TeachWorkspace> {
    return this.updateWorkspaceMeta(userId, workspaceId, { status: 'archived' });
  }

  async listGenerateJobs(userId: string, workspaceId: string): Promise<TeachGenerateJob[]> {
    await this.assertWorkspaceForUser(userId, workspaceId);
    const rows = await this.db
      .select()
      .from(teachGenerateJobs)
      .where(eq(teachGenerateJobs.workspaceId, workspaceId))
      .orderBy(desc(teachGenerateJobs.createdAt))
      .limit(50);
    return rows.map(mapGenerateJob);
  }

  async getWorkspaceDetail(userId: string, workspaceId: string) {
    await this.assertWorkspaceForUser(userId, workspaceId);
    await this.touchWorkspaceOpened(userId, workspaceId);
    let workspace = await this.getWorkspaceForUser(userId, workspaceId);
    if (workspace && this.options.fileStore.repairWorkspaceSeedFilesIfMissing) {
      await this.options.fileStore.repairWorkspaceSeedFilesIfMissing(userId, workspace);
      workspace = await this.getWorkspaceForUser(userId, workspaceId);
    }
    await this.syncWorkspaceLessonCache(userId, workspaceId);
    const lessons = await this.options.fileStore.listWorkspaceLessons(userId, workspaceId);
    const progress = await this.ensureLessonProgressRows(userId, workspaceId);
    return { workspace, lessons, progress };
  }
}

export function createTeachHubDbService(db: DrizzleLikeDb, options: TeachHubDbServiceOptions) {
  return new TeachHubDbService(db, options);
}
