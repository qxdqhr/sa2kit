import type {
  CreateWorkspaceInput,
  GenerateLessonTrigger,
  TeachGenerateJob,
  TeachLessonProgress,
  TeachStoredFile,
  TeachWorkspace,
  TeachWorkspaceSummary,
  UpdateProgressInput,
  WorkspaceStatus,
} from '../types';

export type { GenerateLessonTrigger };
export type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: string };

export type TeachHubApiConfig = {
  /** 子应用根 URL；Web 同域可传 '' */
  apiBaseUrl: string;
  fetch?: typeof fetch;
  credentials?: RequestCredentials;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  onUnauthorized?: () => void;
};

/** 浏览器里裸引用 `fetch` 再调用会 Illegal invocation，需包一层 */
const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (!response.ok) {
    const err =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: string }).error)
        : `请求失败: ${response.status}`;
    throw new Error(err);
  }
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const wrapped = payload as ApiEnvelope<T>;
    if (!wrapped.success) {
      throw new Error(wrapped.error || '请求失败');
    }
    return wrapped.data;
  }
  return payload as T;
}

export class TeachHubApiClient {
  private readonly base: string;
  private readonly fetchFn: typeof fetch;
  private readonly credentials: RequestCredentials;
  private readonly getHeaders?: TeachHubApiConfig['getHeaders'];
  private readonly onUnauthorized?: TeachHubApiConfig['onUnauthorized'];

  constructor(config: TeachHubApiConfig) {
    this.base = config.apiBaseUrl.replace(/\/+$/, '');
    this.fetchFn = config.fetch ?? defaultFetch;
    this.credentials = config.credentials ?? 'same-origin';
    this.getHeaders = config.getHeaders;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request(input: string, init?: RequestInit): Promise<Response> {
    const extraHeaders = this.getHeaders ? await this.getHeaders() : undefined;
    const headers = new Headers(init?.headers);
    if (extraHeaders) {
      new Headers(extraHeaders).forEach((value: string, key: string) => headers.set(key, value));
    }
    const response = await this.fetchFn(input, {
      ...init,
      credentials: init?.credentials ?? this.credentials,
      headers,
    });
    if (response.status === 401) {
      this.onUnauthorized?.();
    }
    return response;
  }

  private url(path: string): string {
    return `${this.base}/api/teach-hub${path}`;
  }

  async fetchWorkspaces(filters?: { status?: WorkspaceStatus }): Promise<TeachWorkspaceSummary[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request(this.url(`/workspaces${suffix}`), { cache: 'no-store' });
    const data = await parseJson<{ items: TeachWorkspaceSummary[] }>(response);
    return data.items;
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<TeachWorkspace> {
    const response = await this.request(this.url('/workspaces'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return parseJson<TeachWorkspace>(response);
  }

  async fetchWorkspaceDetail(workspaceId: string): Promise<{
    workspace: TeachWorkspace | null;
    lessons: Array<{ order: number; slug: string; filename: string; title?: string }>;
    progress: TeachLessonProgress[];
  }> {
    const response = await this.request(this.url(`/workspaces/${encodeURIComponent(workspaceId)}`), {
      cache: 'no-store',
    });
    return parseJson(response);
  }

  async updateWorkspace(
    workspaceId: string,
    patch: { title?: string; status?: WorkspaceStatus; missionSummary?: string | null },
  ): Promise<TeachWorkspace> {
    const response = await this.request(this.url(`/workspaces/${encodeURIComponent(workspaceId)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return parseJson<TeachWorkspace>(response);
  }

  async archiveWorkspace(workspaceId: string): Promise<TeachWorkspace> {
    const response = await this.request(this.url(`/workspaces/${encodeURIComponent(workspaceId)}`), {
      method: 'DELETE',
    });
    return parseJson<TeachWorkspace>(response);
  }

  async fetchWorkspaceFiles(workspaceId: string): Promise<TeachStoredFile[]> {
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/files`),
      { cache: 'no-store' },
    );
    const data = await parseJson<{ files: TeachStoredFile[] }>(response);
    return data.files;
  }

  getWorkspaceFileUrl(workspaceId: string, relativePath: string, raw = false): string {
    const encoded = relativePath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    const base = this.url(
      `/workspaces/${encodeURIComponent(workspaceId)}/files/${encoded}`,
    );
    return raw ? `${base}?raw=1` : base;
  }

  async fetchWorkspaceFileText(
    workspaceId: string,
    relativePath: string,
    options?: { raw?: boolean },
  ): Promise<string> {
    const response = await this.request(
      this.getWorkspaceFileUrl(workspaceId, relativePath, options?.raw),
      { cache: 'no-store' },
    );
    if (!response.ok) {
      throw new Error(`读取文件失败: ${response.status}`);
    }
    return response.text();
  }

  async putWorkspaceFileText(
    workspaceId: string,
    relativePath: string,
    content: string,
  ): Promise<void> {
    const encoded = relativePath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/files/${encoded}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    );
    await parseJson(response);
  }

  async importWorkspaceZip(
    workspaceId: string,
    file: Blob,
    filename = 'import.zip',
  ): Promise<{
    importedFiles: number;
    skippedFiles: number;
    warnings: string[];
    lessonCount: number;
  }> {
    const form = new FormData();
    form.append('file', file, filename);
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/import`),
      { method: 'POST', body: form },
    );
    return parseJson(response);
  }

  async fetchLessonProgress(workspaceId: string): Promise<TeachLessonProgress[]> {
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/progress`),
      { cache: 'no-store' },
    );
    const data = await parseJson<{ items: TeachLessonProgress[] }>(response);
    return data.items;
  }

  async updateLessonProgress(
    workspaceId: string,
    input: UpdateProgressInput,
  ): Promise<TeachLessonProgress> {
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/progress`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    return parseJson<TeachLessonProgress>(response);
  }

  async generateLesson(
    workspaceId: string,
    trigger: GenerateLessonTrigger,
  ): Promise<TeachGenerateJob> {
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/generate`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger }),
      },
    );
    return parseJson<TeachGenerateJob>(response);
  }

  async fetchGenerateJobs(workspaceId: string): Promise<TeachGenerateJob[]> {
    const response = await this.request(
      this.url(`/workspaces/${encodeURIComponent(workspaceId)}/generate`),
      { cache: 'no-store' },
    );
    const data = await parseJson<{ items: TeachGenerateJob[] }>(response);
    return data.items;
  }

  async fetchGenerateJob(workspaceId: string, jobId: string): Promise<TeachGenerateJob> {
    const response = await this.request(
      this.url(
        `/workspaces/${encodeURIComponent(workspaceId)}/generate/${encodeURIComponent(jobId)}`,
      ),
      { cache: 'no-store' },
    );
    return parseJson<TeachGenerateJob>(response);
  }
}
