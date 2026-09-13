import { normalizeComfyBaseUrl } from './validateComfyUrl';

export type ComfyQueueResponse = {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
};

export type ComfyHistoryEntry = {
  status?: { status_str?: string; completed?: boolean };
  outputs?: Record<
    string,
    {
      images?: Array<{ filename: string; subfolder: string; type: string }>;
    }
  >;
};

const SUBMIT_TIMEOUT_MS = 30_000;
const FETCH_TIMEOUT_MS = 60_000;

export class ComfyUiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeComfyBaseUrl(baseUrl);
  }

  private async fetchComfy(path: string, init?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await this.fetchComfy('/system_stats', undefined, 10_000);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : '连接失败',
      };
    }
  }

  async queuePrompt(
    prompt: Record<string, unknown>,
    clientId: string,
  ): Promise<ComfyQueueResponse> {
    const response = await this.fetchComfy(
      '/prompt',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, client_id: clientId }),
      },
      SUBMIT_TIMEOUT_MS,
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `ComfyUI 提交失败 HTTP ${response.status}`);
    }

    const data = (await response.json()) as ComfyQueueResponse;
    if (data.node_errors && Object.keys(data.node_errors).length > 0) {
      throw new Error(`节点错误: ${JSON.stringify(data.node_errors)}`);
    }
    return data;
  }

  async getHistory(promptId: string): Promise<Record<string, ComfyHistoryEntry>> {
    const response = await this.fetchComfy(`/history/${encodeURIComponent(promptId)}`);
    if (!response.ok) {
      throw new Error(`获取历史失败 HTTP ${response.status}`);
    }
    return (await response.json()) as Record<string, ComfyHistoryEntry>;
  }

  async getQueue(): Promise<{
    queue_running: unknown[];
    queue_pending: unknown[];
  }> {
    const response = await this.fetchComfy('/queue');
    if (!response.ok) {
      throw new Error(`获取队列失败 HTTP ${response.status}`);
    }
    return (await response.json()) as { queue_running: unknown[]; queue_pending: unknown[] };
  }

  buildViewUrl(image: { filename: string; subfolder: string; type: string }) {
    const params = new URLSearchParams({
      filename: image.filename,
      subfolder: image.subfolder ?? '',
      type: image.type ?? 'output',
    });
    return `${this.baseUrl}/view?${params.toString()}`;
  }

  async fetchImage(image: { filename: string; subfolder: string; type: string }) {
    const response = await this.fetchComfy(
      `/view?${new URLSearchParams({
        filename: image.filename,
        subfolder: image.subfolder ?? '',
        type: image.type ?? 'output',
      }).toString()}`,
    );
    if (!response.ok) {
      throw new Error(`获取图片失败 HTTP ${response.status}`);
    }
    return response;
  }
}

export function extractOutputImages(
  history: Record<string, ComfyHistoryEntry>,
  promptId: string,
): Array<{ filename: string; subfolder: string; type: string }> {
  const entry = history[promptId];
  if (!entry?.outputs) return [];

  const images: Array<{ filename: string; subfolder: string; type: string }> = [];
  for (const output of Object.values(entry.outputs)) {
    for (const image of output.images ?? []) {
      images.push({
        filename: image.filename,
        subfolder: image.subfolder ?? '',
        type: image.type ?? 'output',
      });
    }
  }
  return images;
}

export function resolveHistoryStatus(
  history: Record<string, ComfyHistoryEntry>,
  promptId: string,
): 'running' | 'success' | 'failed' {
  const entry = history[promptId];
  if (!entry) return 'running';

  const images = extractOutputImages(history, promptId);
  if (images.length > 0) return 'success';

  const statusStr = entry.status?.status_str?.toLowerCase();
  if (statusStr === 'error') return 'failed';
  if (entry.status?.completed) return images.length > 0 ? 'success' : 'failed';

  return 'running';
}
