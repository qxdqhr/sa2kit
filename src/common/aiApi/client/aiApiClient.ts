import type { AiApiResponse, AiApiRunRequest, AiClientSettings } from '../types';
import { pickClientSettingsFromStorage } from './settingsCore';

export class AiApiClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly response?: AiApiResponse
  ) {
    super(message);
    this.name = 'AiApiClientError';
  }
}

export interface AiApiClientOptions {
  /** 默认 POST /api/ai/run，宿主应用可覆盖 */
  runEndpoint?: string;
  fetchImpl?: typeof fetch;
}

/**
 * 通过 HTTP 调用宿主暴露的 AI 任务入口（如 Next.js route）。
 * 连接配置可通过请求体 clientSettings 传入，或从 localStorage 读取。
 */
export async function runAiTask<TInput, TOutput>(
  taskId: string,
  input: TInput,
  options?: {
    signal?: AbortSignal;
    clientSettings?: AiClientSettings;
    runEndpoint?: string;
    fetchImpl?: typeof fetch;
  }
): Promise<AiApiResponse<TOutput>> {
  const fetchFn = options?.fetchImpl ?? fetch;
  const endpoint = options?.runEndpoint ?? '/api/ai/run';
  const clientSettings = options?.clientSettings ?? pickClientSettingsFromStorage();

  const payload: AiApiRunRequest<TInput> = {
    taskId,
    input,
    ...(clientSettings ? { clientSettings } : {}),
  };

  const response = await fetchFn(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: options?.signal,
  });

  const data = (await response.json()) as AiApiResponse<TOutput>;
  return data;
}

export async function runAiTaskOrThrow<TInput, TOutput>(
  taskId: string,
  input: TInput,
  options?: {
    signal?: AbortSignal;
    clientSettings?: AiClientSettings;
    runEndpoint?: string;
    fetchImpl?: typeof fetch;
  }
): Promise<TOutput> {
  const result = await runAiTask<TInput, TOutput>(taskId, input, options);
  if (!result.success || result.data === undefined) {
    throw new AiApiClientError(
      result.error?.message ?? 'AI 任务失败',
      result.error?.code,
      result
    );
  }
  return result.data;
}

export function createAiTaskRunner<TInput, TOutput>(
  taskId: string,
  options?: AiApiClientOptions
) {
  return (
    input: TInput,
    runOptions?: { signal?: AbortSignal; clientSettings?: AiClientSettings }
  ) =>
    runAiTaskOrThrow<TInput, TOutput>(taskId, input, {
      ...runOptions,
      runEndpoint: options?.runEndpoint,
      fetchImpl: options?.fetchImpl,
    });
}

export const aiApiClient = {
  run: runAiTask,
  runOrThrow: runAiTaskOrThrow,
  createRunner: createAiTaskRunner,
};
