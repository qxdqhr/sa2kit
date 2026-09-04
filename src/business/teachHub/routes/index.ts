import type {
  CreateWorkspaceInput,
  LessonProgressStatus,
  UpdateProgressInput,
  WorkspaceStatus,
} from '../domain';
import {
  assertSafeId,
  contentTypeForPath,
  createTeachHubDbService,
  extractMissionWhySummary,
  rewriteTeachHtmlLinks,
  sanitizeRelativePath,
  shouldRewriteHtml,
  type TeachHubDrizzleDb,
  type TeachHubDbServiceOptions,
  type TeachHubFileStoreAdapter,
  type TeachHubGenerateAdapter,
} from '../server';

export type TeachHubSessionUser = { id: string };

export type TeachHubRouteConfig = {
  db: TeachHubDrizzleDb;
  getSessionUser: (request: Request) => Promise<TeachHubSessionUser | null>;
  fileStore: TeachHubFileStoreAdapter;
  formatStorageError?: TeachHubDbServiceOptions['formatStorageError'];
  /** HTML 内链前缀；缺省空串（子应用 basePath 模式） */
  getPublicBase?: () => string;
  generate?: TeachHubGenerateAdapter;
};

type IdRouteContext = { params: Promise<{ id: string }> };

const ALLOWED_STATUS: LessonProgressStatus[] = [
  'locked',
  'available',
  'in_progress',
  'completed',
];

function jsonOk<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function createService(config: TeachHubRouteConfig) {
  return createTeachHubDbService(config.db, {
    fileStore: config.fileStore,
    formatStorageError: config.formatStorageError,
  });
}

function parseWorkspaceId(raw: string): string | null {
  const id = raw.trim();
  if (!id) return null;
  try {
    assertSafeId(id, 'workspaceId');
    return id;
  } catch {
    return null;
  }
}

export function createListWorkspacesHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    try {
      const status = new URL(request.url).searchParams.get('status');
      let items = await service.listWorkspacesByUser(user.id);
      if (status === 'active' || status === 'archived') {
        items = items.filter((w) => w.status === status);
      }
      return jsonOk({ items });
    } catch (error) {
      console.error('[teachHub/workspaces GET]', error);
      return jsonError('获取工作区列表失败', 500);
    }
  };
}

export function createCreateWorkspaceHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    try {
      const body = (await request.json()) as CreateWorkspaceInput;
      const title = body.title?.trim();
      if (!title) return jsonError('title 不能为空');
      const workspace = await service.createWorkspace(user.id, {
        title,
        topic: body.topic,
        missionDraft: body.missionDraft,
      });
      return jsonOk(workspace, 201);
    } catch (error) {
      console.error('[teachHub/workspaces POST]', error);
      const message = error instanceof Error ? error.message : '创建工作区失败';
      return jsonError(
        message.includes('文件存储') ? message : `创建工作区失败：${message}`,
        500,
      );
    }
  };
}

export function createGetWorkspaceHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const detail = await service.getWorkspaceDetail(user.id, workspaceId);
      return jsonOk(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取工作区详情失败';
      if (message.includes('无权') || message.includes('不存在')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/workspaces/:id GET]', error);
      return jsonError('获取工作区详情失败', 500);
    }
  };
}

export function createPatchWorkspaceHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const body = (await request.json()) as {
        title?: string;
        status?: WorkspaceStatus;
        missionSummary?: string | null;
      };
      const patch: {
        title?: string;
        status?: WorkspaceStatus;
        missionSummary?: string | null;
      } = {};
      if (body.title?.trim()) patch.title = body.title.trim();
      if (body.status === 'active' || body.status === 'archived') patch.status = body.status;
      if (body.missionSummary !== undefined) patch.missionSummary = body.missionSummary;
      const workspace = await service.updateWorkspaceMeta(user.id, workspaceId, patch);
      return jsonOk(workspace);
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新工作区失败';
      if (message.includes('无权') || message.includes('不存在')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/workspaces/:id PATCH]', error);
      return jsonError('更新工作区失败', 500);
    }
  };
}

export function createArchiveWorkspaceHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const workspace = await service.archiveWorkspace(user.id, workspaceId);
      return jsonOk(workspace);
    } catch (error) {
      const message = error instanceof Error ? error.message : '归档工作区失败';
      if (message.includes('无权') || message.includes('不存在')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/workspaces/:id DELETE]', error);
      return jsonError('归档工作区失败', 500);
    }
  };
}

export function createListProgressHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const items = await service.ensureLessonProgressRows(user.id, workspaceId);
      return jsonOk({ items });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取学习进度失败';
      if (message.includes('无权') || message.includes('不存在')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/workspaces/:id/progress GET]', error);
      return jsonError('获取学习进度失败', 500);
    }
  };
}

export function createUpsertProgressHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const body = (await request.json()) as UpdateProgressInput;
      if (!body.lessonSlug?.trim()) return jsonError('lessonSlug 不能为空');
      if (!ALLOWED_STATUS.includes(body.status)) return jsonError('非法 status');
      const item = await service.upsertLessonProgress(user.id, workspaceId, {
        lessonSlug: body.lessonSlug.trim(),
        status: body.status,
        quizScore: body.quizScore,
        quizTotal: body.quizTotal,
      });
      return jsonOk(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新进度失败';
      if (message.includes('无权') || message.includes('不存在或')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/workspaces/:id/progress POST]', error);
      return jsonError(message, message.includes('不存在') ? 404 : 500);
    }
  };
}

type FilePathRouteContext = { params: Promise<{ id: string; path: string[] }> };
type JobRouteContext = { params: Promise<{ id: string; jobId: string }> };

function joinPath(segments: string[]): string | null {
  if (!segments.length) return null;
  return sanitizeRelativePath(segments.join('/'));
}

function requireGenerate(config: TeachHubRouteConfig): TeachHubGenerateAdapter {
  if (!config.generate) {
    throw new Error('TeachHubRouteConfig.generate is required for generate routes');
  }
  return config.generate;
}

export function createListFilesHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const files = await config.fileStore.listWorkspaceFiles(user.id, workspaceId);
      return jsonOk({
        files: files.map((f) => ({
          relativePath: f.relativePath,
          mimeType: f.mimeType,
          size: f.size,
          createdAt: f.createdAt,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '列出工作区文件失败';
      if (message.includes('无权') || message.includes('不存在')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/files GET]', error);
      return jsonError('列出工作区文件失败', 500);
    }
  };
}

export function createReadFileHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: FilePathRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId, path } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    const relativePath = joinPath(path);
    if (!relativePath) return jsonError('非法文件路径');

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const workspace = await service.getWorkspaceForUser(user.id, workspaceId);
      if (workspace && config.fileStore.repairWorkspaceSeedFilesIfMissing) {
        await config.fileStore.repairWorkspaceSeedFilesIfMissing(user.id, workspace);
      }

      let content = await config.fileStore.readWorkspaceFileText(
        user.id,
        workspaceId,
        relativePath,
      );
      const raw = new URL(request.url).searchParams.get('raw') === '1';
      if (!raw && shouldRewriteHtml(relativePath)) {
        content = rewriteTeachHtmlLinks(
          content,
          workspaceId,
          config.getPublicBase?.() ?? '',
        );
      }

      const headers: Record<string, string> = {
        'Content-Type': contentTypeForPath(relativePath),
        'Cache-Control': 'private, no-store',
      };
      if (shouldRewriteHtml(relativePath)) {
        headers['X-Frame-Options'] = 'SAMEORIGIN';
        headers['Content-Security-Policy'] = "frame-ancestors 'self'";
      }

      return new Response(content, { status: 200, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取文件失败';
      if (message.includes('无权') || message.includes('不存在或')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      if (message.includes('不存在')) return jsonError(message, 404);
      console.error('[teachHub/files/* GET]', error);
      return jsonError('读取文件失败', 500);
    }
  };
}

export function createWriteFileHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: FilePathRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId, path } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');
    const relativePath = joinPath(path);
    if (!relativePath) return jsonError('非法文件路径');
    if (relativePath.endsWith('.html')) {
      return jsonError('不支持通过 API 直接覆盖 HTML 课时，请使用生成下一课', 400);
    }

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const body = (await request.json()) as { content?: string };
      if (typeof body.content !== 'string') return jsonError('content 必须为字符串');

      await config.fileStore.putWorkspaceFileText({
        userId: user.id,
        workspaceId,
        relativePath,
        content: body.content,
        uploaderId: user.id,
      });

      if (relativePath === 'MISSION.md') {
        const summary = extractMissionWhySummary(body.content);
        await service.updateWorkspaceMeta(user.id, workspaceId, { missionSummary: summary });
      }

      return jsonOk({ relativePath });
    } catch (error) {
      const message = error instanceof Error ? error.message : '写入文件失败';
      if (message.includes('无权') || message.includes('不存在或')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/files/* PUT]', error);
      return jsonError('写入文件失败', 500);
    }
  };
}

export function createImportZipHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return jsonError('请上传 zip 文件（字段名 file）');
      if (!file.name.toLowerCase().endsWith('.zip')) return jsonError('仅支持 .zip 格式');

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await config.fileStore.importWorkspaceZip({
        userId: user.id,
        workspaceId,
        zipBuffer: buffer,
        uploaderId: user.id,
      });

      if (!result.validation.ok) {
        return jsonError(
          `导入完成但工作区校验失败: ${result.validation.errors.join('; ')}`,
          422,
        );
      }

      await service.syncWorkspaceLessonCache(user.id, workspaceId);
      await service.ensureLessonProgressRows(user.id, workspaceId);

      return jsonOk({
        importedFiles: result.importedFiles,
        skippedFiles: result.skippedFiles,
        warnings: result.validation.warnings,
        lessonCount: result.validation.lessonCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入工作区失败';
      if (message.includes('无权') || message.includes('不存在或')) {
        return jsonError('工作区不存在或无权访问', 403);
      }
      console.error('[teachHub/import POST]', error);
      return jsonError('导入工作区失败', 500);
    }
  };
}

export function createGenerateLessonHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  const generate = requireGenerate(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const body = (await request.json()) as { trigger?: 'first_lesson' | 'next_lesson' };
      const trigger = body.trigger;
      if (trigger !== 'first_lesson' && trigger !== 'next_lesson') {
        return jsonError('trigger 必须为 first_lesson 或 next_lesson');
      }

      const pre = await generate.checkGeneratePreconditions(user.id, workspaceId, trigger);
      if (!pre.ok) return jsonError(pre.reason, 400);

      const job = await generate.runGenerateLesson({
        userId: user.id,
        workspaceId,
        trigger,
      });

      if (job.status === 'failed') {
        return jsonError(job.errorMessage || '生成失败', 500);
      }
      return jsonOk(job, 201);
    } catch (error) {
      console.error('[teachHub/generate POST]', error);
      return jsonError(error instanceof Error ? error.message : '生成失败', 500);
    }
  };
}

export function createListGenerateJobsHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  const generate = requireGenerate(config);
  return async (request: Request, context: IdRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const items = await generate.listGenerateJobsForUser(user.id, workspaceId);
      return jsonOk({ items });
    } catch (error) {
      console.error('[teachHub/generate GET]', error);
      return jsonError('获取生成记录失败', 500);
    }
  };
}

export function createGetGenerateJobHandler(config: TeachHubRouteConfig) {
  const service = createService(config);
  const generate = requireGenerate(config);
  return async (request: Request, context: JobRouteContext) => {
    const user = await config.getSessionUser(request);
    if (!user) return jsonError('未授权访问', 401);
    const { id: rawId, jobId } = await context.params;
    const workspaceId = parseWorkspaceId(rawId);
    if (!workspaceId) return jsonError('非法 workspace id');

    try {
      await service.assertWorkspaceForUser(user.id, workspaceId);
      const job = await generate.getGenerateJobForUser(user.id, workspaceId, jobId);
      if (!job) return jsonError('任务不存在', 404);
      return jsonOk(job);
    } catch (error) {
      console.error('[teachHub/generate/:jobId GET]', error);
      return jsonError('获取任务失败', 500);
    }
  };
}
