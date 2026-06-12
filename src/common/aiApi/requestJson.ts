import type { RequestAdapter } from '../request';

export type JsonRequestOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  requestAdapter?: RequestAdapter;
};

export async function requestJson<T>(options: JsonRequestOptions): Promise<T> {
  const { url, method = 'POST', headers = {}, body, timeoutMs, requestAdapter } = options;

  if (requestAdapter) {
    return requestAdapter.request<T>({
      url,
      method,
      headers,
      body,
    });
  }

  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs
    ? setTimeout(() => {
        controller?.abort();
      }, timeoutMs)
    : undefined;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });

    const text = await response.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const record = data as { error?: { message?: string } | string; message?: string } | null;
      const errorMessage =
        (typeof record?.error === 'object' ? record.error?.message : record?.error) ||
        record?.message ||
        `Request failed with status ${response.status}`;
      const error = new Error(String(errorMessage));
      (error as Error & { status?: number; data?: unknown }).status = response.status;
      (error as Error & { status?: number; data?: unknown }).data = data;
      throw error;
    }

    return data as T;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
