import type { ApiResponse } from './types';

type JsonInit = Omit<RequestInit, 'body'> & { body?: BodyInit | object | null };

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`服务器响应异常 (${res.status})`);
  }
}

export async function nodeNotesFetch<T>(url: string, init?: JsonInit): Promise<T> {
  const { body, headers, ...rest } = init ?? {};
  const res = await fetch(url, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body:
      body == null
        ? undefined
        : body instanceof FormData || typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });

  const json = await parseResponse<T>(res);
  if (!json.success) {
    throw new Error(json.message || `请求失败 (${res.status})`);
  }
  if (json.data === undefined) {
    throw new Error(json.message || '响应缺少数据');
  }
  return json.data;
}

export async function nodeNotesFetchVoid(url: string, init?: JsonInit): Promise<void> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
    body:
      init?.body == null
        ? undefined
        : init.body instanceof FormData || typeof init.body === 'string'
          ? init.body
          : JSON.stringify(init.body),
  });
  const json = await parseResponse<unknown>(res);
  if (!json.success) {
    throw new Error(json.message || `请求失败 (${res.status})`);
  }
}
