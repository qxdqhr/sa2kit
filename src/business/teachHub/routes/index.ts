import type { NextRequest } from 'next/server';
import type {
  CreateWorkspaceInput,
  LessonProgressStatus,
  UpdateProgressInput,
  WorkspaceStatus,
} from '../domain';
import {
  assertSafeId,
  createTeachHubDbService,
  type DrizzleLikeDb,
  type TeachHubDbServiceOptions,
  type TeachHubFileStoreAdapter,
} from '../server';

export type TeachHubSessionUser = { id: string };

export type TeachHubRouteConfig = {
  db: DrizzleLikeDb;
  getSessionUser: (request: NextRequest) => Promise<TeachHubSessionUser | null>;
  fileStore: TeachHubFileStoreAdapter;
  formatStorageError?: TeachHubDbServiceOptions['formatStorageError'];
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
  return async (request: NextRequest) => {
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
  return async (request: NextRequest) => {
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
  return async (request: NextRequest, context: IdRouteContext) => {
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
  return async (request: NextRequest, context: IdRouteContext) => {
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
  return async (request: NextRequest, context: IdRouteContext) => {
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
  return async (request: NextRequest, context: IdRouteContext) => {
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
  return async (request: NextRequest, context: IdRouteContext) => {
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
