import type { RequestAdapter } from '../../../request';

export type JsonRequestOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  requestAdapter?: RequestAdapter;
};

export const requestJson = async <T>(options: JsonRequestOptions): Promise<T> => {
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
      body: body ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });

    const text = await response.text();
    let data: any = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data as T;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
