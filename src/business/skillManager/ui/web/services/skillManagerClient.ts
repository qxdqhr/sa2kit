import type { SkillDetail, SkillListResponse, SkillSource, SkillStatus, SkillSyncTask } from '../../../domain/types';
import { uploadModuleFile } from 'sa2kit/common/file/client';

export type ConflictPolicy = 'skip' | 'overwrite';
const UPLOAD_CONCURRENCY = 4;
const MAX_UPLOAD_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 400;

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }

  return (await response.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function uploadWithRetry(input: {
  file: File;
  moduleId: string;
  businessId: string;
  folderPath: string;
  permission: 'private' | 'public';
}) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_UPLOAD_RETRIES) {
    try {
      return await uploadModuleFile({
        file: input.file,
        moduleId: input.moduleId,
        businessId: input.businessId,
        folderPath: input.folderPath,
        permission: input.permission,
      });
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= MAX_UPLOAD_RETRIES) {
        break;
      }
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('上传失败');
}

export async function fetchSkillList(filters?: {
  query?: string;
  source?: SkillSource | 'all';
  status?: SkillStatus | 'all';
  page?: number;
  limit?: number;
}): Promise<SkillListResponse> {
  const params = new URLSearchParams();
  if (filters?.query?.trim()) {
    params.set('q', filters.query.trim());
  }
  if (filters?.source && filters.source !== 'all') {
    params.set('source', filters.source);
  }
  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters?.page && filters.page > 0) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit && filters.limit > 0) {
    params.set('limit', String(filters.limit));
  }

  const url = params.toString() ? `/api/skill-manager/skills?${params.toString()}` : '/api/skill-manager/skills';
  const response = await fetch(url, { cache: 'no-store' });
  return parseJson<SkillListResponse>(response);
}

export async function fetchSkillDetail(id: string): Promise<SkillDetail> {
  const response = await fetch(`/api/skill-manager/skills/${encodeURIComponent(id)}`, {
    cache: 'no-store'
  });
  return parseJson<SkillDetail>(response);
}

export async function fetchSkillFileContent(id: string, relativePath: string): Promise<string> {
  const params = new URLSearchParams({ path: relativePath });
  const response = await fetch(`/api/skill-manager/skills/${encodeURIComponent(id)}/file?${params.toString()}`, {
    cache: 'no-store'
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }
  return response.text();
}

export async function saveSkillContent(
  id: string,
  content: string,
  options?: { status?: SkillStatus; source?: SkillSource }
): Promise<{ ok: boolean; updatedAt: string; status: SkillStatus; source: SkillSource }> {
  const response = await fetch(`/api/skill-manager/skills/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, ...options })
  });

  return parseJson<{ ok: boolean; updatedAt: string; status: SkillStatus; source: SkillSource }>(response);
}

export async function uploadSkillMarkdown(
  skillId: string,
  file: File,
  policy: ConflictPolicy
): Promise<{ ok: boolean; id: string; skipped?: boolean; fileId: string; accessUrl?: string }> {
  void policy;
  const meta = await uploadWithRetry({
    file,
    moduleId: 'skill-manager',
    businessId: skillId,
    folderPath: `skill-manager/${skillId}/SKILL.md`,
    permission: 'private'
  });

  return {
    ok: true,
    id: skillId,
    skipped: false,
    fileId: meta.fileId,
    accessUrl: meta.accessUrl
  };
}

export async function importSkillDirectory(
  files: File[],
  policy: ConflictPolicy
): Promise<{
  ok: boolean;
  importedFiles: number;
  skippedFiles: number;
  details: Array<{ path: string; status: 'imported' | 'skipped'; reason?: string; fileId?: string; accessUrl?: string }>;
}> {
  void policy;
  const details: Array<{ path: string; status: 'imported' | 'skipped'; reason?: string; fileId?: string; accessUrl?: string }> = [];
  const tasks = files.map((file) => async () => {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const normalized = rel.replaceAll('\\', '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length < 2) {
      return { path: normalized, status: 'skipped' as const, reason: '路径层级不足' };
    }
    const skillId = parts[0];
    try {
      const meta = await uploadWithRetry({
        file,
        moduleId: 'skill-manager',
        businessId: skillId,
        folderPath: `skill-manager/${skillId}/${parts.slice(1).join('/')}`,
        permission: 'private'
      });
      return {
        path: normalized,
        status: 'imported' as const,
        fileId: meta.fileId,
        accessUrl: meta.accessUrl
      };
    } catch (error) {
      return {
        path: normalized,
        status: 'skipped' as const,
        reason: error instanceof Error ? error.message : '上传失败'
      };
    }
  });

  for (let i = 0; i < tasks.length; i += UPLOAD_CONCURRENCY) {
    const batch = tasks.slice(i, i + UPLOAD_CONCURRENCY);
    const result = await Promise.all(batch.map((run) => run()));
    for (const item of result) {
      details.push(item);
    }
  }

  const importedFiles = details.filter((x) => x.status === 'imported').length;
  const skippedFiles = details.length - importedFiles;
  return { ok: true, importedFiles, skippedFiles, details };
}

export function getSkillDownloadUrl(id: string): string {
  return `/api/skill-manager/skills/${encodeURIComponent(id)}/download`;
}

export async function downloadBatchSkills(ids: string[]): Promise<Blob> {
  const response = await fetch('/api/skill-manager/skills/download-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }

  return response.blob();
}


export async function preflightBatchDownload(ids: string[]): Promise<{ ok: boolean; exists: string[]; missing: string[]; invalid: string[] }> {
  const response = await fetch('/api/skill-manager/skills/download-batch/preflight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });

  return parseJson<{ ok: boolean; exists: string[]; missing: string[]; invalid: string[] }>(response);
}

export async function createSyncTask(payload: {
  skillIds: string[];
  mode?: 'local-to-web';
  strategy?: 'ff-only' | 'manual';
}): Promise<SkillSyncTask> {
  const response = await fetch('/api/skill-manager/sync/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return parseJson<SkillSyncTask>(response);
}

export async function fetchSyncTask(taskId: string): Promise<SkillSyncTask> {
  const response = await fetch(`/api/skill-manager/sync/tasks/${encodeURIComponent(taskId)}`, {
    cache: 'no-store'
  });
  return parseJson<SkillSyncTask>(response);
}

export async function retrySyncTask(taskId: string): Promise<SkillSyncTask> {
  const response = await fetch(`/api/skill-manager/sync/tasks/${encodeURIComponent(taskId)}/retry`, {
    method: 'POST'
  });
  return parseJson<SkillSyncTask>(response);
}

export async function resolveSyncTaskConflicts(
  taskId: string,
  resolutions: Array<{ skillId: string; decision: 'local' | 'remote' | 'merge_edit'; mergedContent?: string }>
): Promise<SkillSyncTask> {
  const response = await fetch(`/api/skill-manager/sync/tasks/${encodeURIComponent(taskId)}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resolutions })
  });
  return parseJson<SkillSyncTask>(response);
}
