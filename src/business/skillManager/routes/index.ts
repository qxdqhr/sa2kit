/**
 * skillManager 路由工厂（Phase H2）
 * Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import { randomUUID } from 'crypto';
import { parseSkillFrontmatter, validateSkillMarkdownContent } from '../domain/skillMarkdown';
import type { SkillSource, SkillStatus } from '../domain/types';
import {
  createSkillManagerSyncService,
  type SkillManagerDrizzleDb,
  type SkillManagerSyncService,
} from '../server/syncService';
import type { SkillManagerFileStore } from '../server/fileStore';

export type SkillManagerSessionUser = { id: string; role?: string };

export type SkillManagerRouteConfig = {
  db: SkillManagerDrizzleDb;
  fileStore: SkillManagerFileStore;
  getSessionUser: (request: Request) => Promise<SkillManagerSessionUser | null>;
  isAdminRole?: (role?: string) => boolean;
  getAdminSourceOptions?: () => SkillSource[];
};

type IdRouteContext = { params: Promise<{ id: string }> };
type TaskIdRouteContext = { params: Promise<{ taskId: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function unauthorized(message = '未授权的访问') {
  return json({ error: message }, 401);
}

function forbidden(message: string) {
  return json({ error: message }, 403);
}

function normalizeDate(iso: string): string {
  return iso.replace('T', ' ').slice(0, 19);
}

function sanitizeSkillId(raw: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(raw) ? raw : null;
}

function sanitizeRelativePath(raw: string): string | null {
  const normalized = raw.replaceAll('\\', '/').trim();
  if (!normalized) return null;
  if (normalized.startsWith('/')) return null;
  if (normalized.includes('..')) return null;
  return normalized;
}

function detectContentType(filePath: string): string {
  if (filePath.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function normalizeSource(source: unknown): SkillSource {
  return source === 'manual_upload' || source === 'remote' || source === 'local_cursor' ? source : 'manual_upload';
}

function normalizeStatus(status: unknown): SkillStatus {
  return status === 'published' || status === 'archived' || status === 'draft' ? status : 'draft';
}

function defaultAdminSourceOptions(): SkillSource[] {
  const raw = process.env.SKILL_MANAGER_ADMIN_SOURCE_OPTIONS?.trim();
  if (!raw) return ['local_cursor', 'manual_upload', 'remote'];
  const tokens = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const allowed = new Set<SkillSource>();
  for (const token of tokens) {
    if (token === 'local_cursor' || token === 'manual_upload' || token === 'remote') {
      allowed.add(token);
    }
  }
  return allowed.size ? Array.from(allowed) : ['local_cursor', 'manual_upload', 'remote'];
}

function extractDescription(content: string): string {
  const parsed = parseSkillFrontmatter(content);
  if (parsed.data.description) return parsed.data.description;
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith('#'));
  return lines[0] || '暂无描述';
}

function parseFrontmatterTags(content: string): { description: string; tags: string[] } {
  const parsed = parseSkillFrontmatter(content);
  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
  return { description: parsed.data.description, tags };
}

async function requireUser(config: SkillManagerRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}

function createSync(config: SkillManagerRouteConfig): SkillManagerSyncService {
  return createSkillManagerSyncService({ db: config.db, fileStore: config.fileStore });
}

export function createListSkillsHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const params = new URL(request.url).searchParams;
      const q = params.get('q')?.trim().toLowerCase() || '';
      const source = params.get('source')?.trim() as SkillSource | 'all' | null;
      const status = params.get('status')?.trim() as SkillStatus | 'all' | null;
      const pageRaw = Number(params.get('page') || '1');
      const limitRaw = Number(params.get('limit') || '10');
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 10;

      let skillIds: string[] = [];
      try {
        skillIds = await fileStore.listSkillIds();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const maybeMissingTable =
          message.includes('does not exist') ||
          message.includes('relation') ||
          message.includes('no such table');
        if (maybeMissingTable) {
          return json({ items: [], total: 0, page, limit });
        }
        throw error;
      }

      const items = await Promise.all(
        skillIds.map(async (id) => {
          try {
            const files = await fileStore.listSkillFiles(id);
            const skillMd = files.find((f) => f.relativePath === 'SKILL.md') || files[0];
            if (!skillMd) return null;
            const content = await fileStore.readTextFileById(skillMd.id);
            const fm = parseFrontmatterTags(content);
            const meta = fileStore.readMeta(skillMd);
            return {
              id,
              name: id,
              description: extractDescription(content),
              updatedAt: normalizeDate(skillMd.createdAt),
              tags: fm.tags,
              source: meta.source,
              status: meta.status,
            };
          } catch (error) {
            console.warn(`[skill-manager] 跳过异常 skill: ${id}`, error);
            return null;
          }
        }),
      );

      const compact = items.filter(Boolean) as Array<{
        id: string;
        name: string;
        description: string;
        updatedAt: string;
        tags: string[];
        source: SkillSource;
        status: SkillStatus;
      }>;

      const filtered = compact.filter((item) => {
        if (source && source !== 'all' && item.source !== source) return false;
        if (status && status !== 'all' && item.status !== status) return false;
        if (!q) return true;
        const content = `${item.id} ${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
        return content.includes(q);
      });

      filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return json({ items: paged, total, page, limit });
    } catch (error) {
      console.error('[skill-manager] list failed:', error);
      return json({ items: [], total: 0, page: 1, limit: 10, error: '读取技能目录失败' }, 500);
    }
  };
}

export function createGetSkillHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request, context: IdRouteContext) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const { id: rawId } = await context.params;
      const id = sanitizeSkillId(rawId);
      if (!id) return json({ error: '非法 skill id' }, 400);

      const files = await fileStore.listSkillFiles(id);
      const skillMd = files.find((f) => f.relativePath === 'SKILL.md') || files[0];
      if (!skillMd) return json({ error: 'Skill 不存在' }, 404);

      const content = await fileStore.readTextFileById(skillMd.id);
      const fm = parseFrontmatterTags(content);
      const meta = fileStore.readMeta(skillMd);
      return json({
        id,
        name: id,
        description: extractDescription(content),
        updatedAt: normalizeDate(skillMd.createdAt),
        tags: fm.tags,
        source: meta.source,
        status: meta.status,
        content,
        files: files.map((x) => x.relativePath),
      });
    } catch (error) {
      console.error('[skill-manager] detail failed:', error);
      return json({ error: '读取技能详情失败' }, 500);
    }
  };
}

export function createUpdateSkillHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  const getAllowedSources = config.getAdminSourceOptions || defaultAdminSourceOptions;
  const checkAdmin = config.isAdminRole || (() => false);

  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const { id: rawId } = await context.params;
      const id = sanitizeSkillId(rawId);
      if (!id) return json({ error: '非法 skill id' }, 400);

      const body = (await request.json()) as { content?: string; status?: SkillStatus; source?: SkillSource };
      const content = body.content ?? '';
      const validationError = validateSkillMarkdownContent(content);
      if (validationError) return json({ error: validationError }, 400);

      if (body.source !== undefined) {
        if (!checkAdmin(user.role)) {
          return forbidden('source 仅管理员可修改');
        }
        const allowedSources = getAllowedSources();
        const nextSource = normalizeSource(body.source);
        if (!allowedSources.includes(nextSource)) {
          return json({ error: `source 不在允许范围内: ${allowedSources.join(',')}` }, 400);
        }
      }

      const prevSkillMd = await fileStore.getSkillFileByRelativePath(id, 'SKILL.md');
      const prevMeta = prevSkillMd
        ? fileStore.readMeta(prevSkillMd)
        : { source: 'manual_upload' as SkillSource, status: 'draft' as SkillStatus };
      const nextMeta = {
        source: body.source ? normalizeSource(body.source) : prevMeta.source,
        status: body.status ? normalizeStatus(body.status) : prevMeta.status,
      };
      const uploaded = await fileStore.uploadSkillFile({
        skillId: id,
        relativePath: 'SKILL.md',
        content,
        source: nextMeta.source,
        status: nextMeta.status,
        uploaderId: String(user.id),
      });

      return json({
        ok: true,
        id,
        updatedAt: normalizeDate(new Date().toISOString()),
        source: nextMeta.source,
        status: nextMeta.status,
        fileId: uploaded.fileId,
        accessUrl: uploaded.accessUrl,
      });
    } catch (error) {
      console.error('[skill-manager] save failed:', error);
      return json({ error: '保存 Skill 失败' }, 500);
    }
  };
}

export function createGetSkillFileHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request, context: IdRouteContext) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const { id: rawId } = await context.params;
      const id = sanitizeSkillId(rawId);
      if (!id) return json({ error: '非法 skill id' }, 400);

      const filePathParam = new URL(request.url).searchParams.get('path') || '';
      const relativePath = sanitizeRelativePath(filePathParam);
      if (!relativePath) return json({ error: '缺少或非法 path 参数' }, 400);

      const file = await fileStore.getSkillFileByRelativePath(id, relativePath);
      if (!file) return json({ error: '文件不存在' }, 404);
      const content = await fileStore.readTextFileById(file.id);
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': detectContentType(relativePath) },
      });
    } catch (error) {
      console.error('[skill-manager] read file failed:', error);
      return json({ error: '读取文件失败' }, 500);
    }
  };
}

export function createDownloadSkillHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request, context: IdRouteContext) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const { id: rawId } = await context.params;
      const id = sanitizeSkillId(rawId);
      if (!id) return json({ error: '非法 skill id' }, 400);

      const files = await fileStore.listSkillFiles(id);
      if (!files.length) return json({ error: 'Skill 不存在' }, 404);
      const buffer = await fileStore.buildSkillZip(id);

      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="${id}.zip"`);
      return new Response(new Uint8Array(buffer), { status: 200, headers });
    } catch (error) {
      console.error('[skill-manager] download failed:', error);
      return json({ error: '下载失败' }, 500);
    }
  };
}

export function createBatchDownloadPreflightHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const body = (await request.json()) as { ids?: string[] };
      const ids = Array.isArray(body.ids) ? body.ids : [];

      const exists: string[] = [];
      const missing: string[] = [];
      const invalid: string[] = [];

      for (const raw of ids) {
        const id = sanitizeSkillId(raw);
        if (!id) {
          invalid.push(raw);
          continue;
        }
        const files = await fileStore.listSkillFiles(id);
        if (files.length > 0) exists.push(id);
        else missing.push(id);
      }

      return json({ ok: true, exists, missing, invalid });
    } catch (error) {
      console.error('[skill-manager] preflight failed:', error);
      return json({ error: '预检失败' }, 500);
    }
  };
}

export function createBatchDownloadHandler(config: SkillManagerRouteConfig) {
  const { fileStore } = config;
  return async (request: Request) => {
    const { response } = await requireUser(config, request);
    if (response) return response;

    try {
      const body = (await request.json()) as { ids?: string[] };
      const ids = Array.isArray(body.ids) ? body.ids : [];
      const sanitized = ids.map(sanitizeSkillId).filter(Boolean) as string[];
      if (!sanitized.length) return json({ error: '请至少选择一个 skill' }, 400);

      const stdout = await fileStore.buildBatchZip(sanitized);
      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', 'attachment; filename="skills-batch.zip"');
      return new Response(new Uint8Array(stdout), { status: 200, headers });
    } catch (error) {
      console.error('[skill-manager] batch download failed:', error);
      return json({ error: '批量下载失败' }, 500);
    }
  };
}

export function createCreateSyncTaskHandler(config: SkillManagerRouteConfig) {
  return async (request: Request) => {
    const sync = createSync(config);
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const body = (await request.json()) as {
        skillIds?: string[];
        mode?: 'local-to-web';
        strategy?: 'ff-only' | 'manual';
      };
      const skillIds = Array.isArray(body.skillIds)
        ? body.skillIds.filter((x) => typeof x === 'string' && x.trim())
        : [];
      if (!skillIds.length) return json({ error: 'skillIds 不能为空' }, 400);

      const strategy: 'ff-only' | 'manual' = body.strategy === 'manual' ? 'manual' : 'ff-only';
      const state = await sync.readSyncStateMap();
      const executed = await sync.executeSyncTask({ skillIds, strategy, prevState: state });
      await sync.writeSyncStateMap(executed.nextState);
      const task = sync.buildTaskFromItems({
        taskId: randomUUID(),
        strategy,
        items: executed.items,
        logs: [
          {
            at: new Date().toISOString(),
            level: 'info',
            message: `创建同步任务，策略=${strategy}，输入=${skillIds.length}项`,
          },
          {
            at: new Date().toISOString(),
            level: executed.items.some((x) => x.status === 'failed') ? 'warn' : 'info',
            message: `执行完成：成功=${executed.items.filter((x) => x.status === 'success').length} 失败=${executed.items.filter((x) => x.status === 'failed').length}`,
          },
        ],
      });
      await sync.upsertTask(task);
      return json(task);
    } catch (error) {
      console.error('[skill-manager] create sync task failed:', error);
      return json({ error: '创建同步任务失败' }, 500);
    }
  };
}

export function createGetSyncTaskHandler(config: SkillManagerRouteConfig) {
  return async (request: Request, context: TaskIdRouteContext) => {
    const sync = createSync(config);
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const { taskId } = await context.params;
      const tasks = await sync.readTasks();
      const task = tasks.find((x) => x.taskId === taskId);
      if (!task) return json({ error: '任务不存在' }, 404);
      return json(task);
    } catch (error) {
      console.error('[skill-manager] get sync task failed:', error);
      return json({ error: '查询同步任务失败' }, 500);
    }
  };
}

export function createRetrySyncTaskHandler(config: SkillManagerRouteConfig) {
  return async (request: Request, context: TaskIdRouteContext) => {
    const sync = createSync(config);
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const { taskId } = await context.params;
      const tasks = await sync.readTasks();
      const idx = tasks.findIndex((x) => x.taskId === taskId);
      if (idx < 0) return json({ error: '任务不存在' }, 404);

      const task = tasks[idx];
      const failedSkillIds = task.items.filter((x) => x.status === 'failed').map((x) => x.skillId);
      if (!failedSkillIds.length) return json(task);

      const state = await sync.readSyncStateMap();
      const rerun = await sync.executeSyncTask({
        skillIds: failedSkillIds,
        strategy: task.strategy,
        prevState: state,
      });
      await sync.writeSyncStateMap(rerun.nextState);

      const mergedItems = task.items.map((item) => {
        const hit = rerun.items.find((x) => x.skillId === item.skillId);
        return hit || item;
      });

      const updatedTask = sync.buildTaskFromItems({
        taskId: task.taskId,
        strategy: task.strategy,
        items: mergedItems,
        createdAt: task.createdAt,
        logs: [
          ...(task.logs || []),
          {
            at: new Date().toISOString(),
            level: 'info',
            message: `重试失败项：输入=${failedSkillIds.length}项`,
          },
          {
            at: new Date().toISOString(),
            level: rerun.items.some((x) => x.status === 'failed') ? 'warn' : 'info',
            message: `重试结果：成功=${rerun.items.filter((x) => x.status === 'success').length} 失败=${rerun.items.filter((x) => x.status === 'failed').length}`,
          },
        ],
      });
      await sync.upsertTask(updatedTask);
      return json(updatedTask);
    } catch (error) {
      console.error('[skill-manager] retry sync task failed:', error);
      return json({ error: '重试同步任务失败' }, 500);
    }
  };
}

type ResolutionDecision = 'local' | 'remote' | 'merge_edit';

export function createResolveSyncTaskHandler(config: SkillManagerRouteConfig) {
  return async (request: Request, context: TaskIdRouteContext) => {
    const sync = createSync(config);
    try {
      const user = await config.getSessionUser(request);
      if (!user) return unauthorized();

      const { taskId } = await context.params;
      const body = (await request.json()) as {
        resolutions?: Array<{ skillId?: string; decision?: ResolutionDecision; mergedContent?: string }>;
      };
      const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];
      if (!resolutions.length) return json({ error: 'resolutions 不能为空' }, 400);

      const tasks = await sync.readTasks();
      const idx = tasks.findIndex((x) => x.taskId === taskId);
      if (idx < 0) return json({ error: '任务不存在' }, 404);
      const task = tasks[idx];
      if (task.strategy !== 'manual') {
        return json({ error: '仅 manual 策略支持冲突手工处理' }, 400);
      }

      const resolutionMap = new Map<string, { decision: ResolutionDecision; mergedContent?: string }>();
      for (const item of resolutions) {
        if (!item.skillId || !item.decision) continue;
        resolutionMap.set(item.skillId, {
          decision: item.decision,
          mergedContent: item.mergedContent,
        });
      }

      const nextItems = [...task.items];
      for (let i = 0; i < nextItems.length; i += 1) {
        const item = nextItems[i];
        if (item.status !== 'failed') continue;
        const resolution = resolutionMap.get(item.skillId);
        if (!resolution) continue;
        const { decision, mergedContent } = resolution;

        if (decision === 'merge_edit') {
          const merged = (mergedContent || '').trim();
          if (!merged) {
            nextItems[i] = { ...item, status: 'failed', reason: 'merge_edit 需要填写合并后的 SKILL.md 内容' };
            continue;
          }
          const mergedHash = await sync.saveSkillMarkdownBySyncDecision(item.skillId, merged);
          if (!mergedHash) {
            nextItems[i] = { ...item, status: 'failed', reason: '写入合并内容失败' };
            continue;
          }
          await sync.setSkillSyncState(item.skillId, {
            baseHash: mergedHash,
            remoteHash: mergedHash,
            updatedAt: new Date().toISOString(),
          });
          nextItems[i] = {
            ...item,
            status: 'success',
            reason: 'manual 决策已应用：merge_edit 内容已写入数据库并同步',
          };
          continue;
        }

        if (decision === 'local') {
          const localHash = (await sync.getCurrentSkillMarkdownHash(item.skillId)) || '';
          if (!localHash) {
            nextItems[i] = { ...item, status: 'failed', reason: 'SKILL.md 不存在，无法应用 local 决策' };
            continue;
          }
          await sync.setSkillSyncState(item.skillId, {
            baseHash: localHash,
            remoteHash: localHash,
            updatedAt: new Date().toISOString(),
          });
          nextItems[i] = {
            ...item,
            status: 'success',
            reason: 'manual 决策已应用：使用数据库当前版本作为同步基线',
          };
          continue;
        }

        if (decision === 'remote') {
          const prev = await sync.getSkillSyncState(item.skillId);
          if (!prev || !prev.remoteHash) {
            nextItems[i] = { ...item, status: 'failed', reason: '缺少远端快照，无法应用 remote 决策' };
            continue;
          }
          await sync.setSkillSyncState(item.skillId, {
            baseHash: prev.remoteHash,
            remoteHash: prev.remoteHash,
            updatedAt: new Date().toISOString(),
          });
          nextItems[i] = { ...item, status: 'success', reason: 'manual 决策已应用：采用远端版本' };
        }
      }

      const updatedTask = sync.buildTaskFromItems({
        taskId: task.taskId,
        strategy: task.strategy,
        items: nextItems,
        createdAt: task.createdAt,
        logs: [
          ...(task.logs || []),
          {
            at: new Date().toISOString(),
            level: 'info',
            message: `应用手工冲突决策：输入=${resolutions.length}项`,
          },
          {
            at: new Date().toISOString(),
            level: nextItems.some((x) => x.status === 'failed') ? 'warn' : 'info',
            message: `决策后状态：成功=${nextItems.filter((x) => x.status === 'success').length} 失败=${nextItems.filter((x) => x.status === 'failed').length}`,
          },
        ],
      });
      await sync.upsertTask(updatedTask);
      return json(updatedTask);
    } catch (error) {
      console.error('[skill-manager] resolve sync task failed:', error);
      return json({ error: '冲突处理失败' }, 500);
    }
  };
}
