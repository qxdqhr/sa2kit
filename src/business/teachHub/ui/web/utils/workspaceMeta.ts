import type { WorkspaceMeta } from '../types';

const META_PATH = '.meta.json';

export const WORKSPACE_META_PATH = META_PATH;

const DEFAULT_META: Pick<WorkspaceMeta, 'autoSyncLessonResources'> = {
  autoSyncLessonResources: false,
};

export function parseWorkspaceMetaJson(raw: string): WorkspaceMeta {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceMeta>;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      topic: typeof parsed.topic === 'string' ? parsed.topic : null,
      language: typeof parsed.language === 'string' ? parsed.language : 'zh-CN',
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      forkedFrom: typeof parsed.forkedFrom === 'string' ? parsed.forkedFrom : null,
      autoSyncLessonResources: parsed.autoSyncLessonResources === true,
    };
  } catch {
    return {
      version: 1,
      title: '',
      topic: null,
      language: 'zh-CN',
      createdAt: new Date().toISOString(),
      forkedFrom: null,
      ...DEFAULT_META,
    };
  }
}

export function composeWorkspaceMetaJson(meta: WorkspaceMeta): string {
  return JSON.stringify(meta, null, 2);
}

export function patchWorkspaceMetaJson(
  raw: string,
  patch: Partial<Pick<WorkspaceMeta, 'autoSyncLessonResources'>>,
): string {
  const current = parseWorkspaceMetaJson(raw);
  return composeWorkspaceMetaJson({
    ...current,
    ...patch,
  });
}
