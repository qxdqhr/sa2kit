import type { RequestAdapter, RequestConfig } from '../../request/types/types';
import type { PlatformAdapter } from '../../common/platform/types';

/** 与标准 fetch 兼容，供 ossFile 客户端注入（Taro / Hono SSR 等） */
export type OssFileFetchFn = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export type OssFileHttpConfig = {
  fetch?: OssFileFetchFn;
};

let globalHttpConfig: OssFileHttpConfig = {};

export function configureOssFileHttp(config: OssFileHttpConfig): void {
  globalHttpConfig = { ...globalHttpConfig, ...config };
}

/** @internal 测试重置 */
export function resetOssFileHttpForTesting(): void {
  globalHttpConfig = {};
}

function isMultipartBody(body: BodyInit | null | undefined): boolean {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams
  );
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) {
    return out;
  }
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      out[key] = value;
    }
    return out;
  }
  return { ...headers };
}

/**
 * 将 RequestAdapter 桥接为 fetch 形态（JSON 请求）。
 * multipart 上传需通过 `configureOssFileHttp({ fetch })` 注入完整 fetch。
 */
export function createOssFileFetchFromAdapter(
  adapter: RequestAdapter,
): OssFileFetchFn {
  return async (url, init = {}) => {
    if (isMultipartBody(init.body ?? null)) {
      throw new Error(
        '[ossFile] RequestAdapter 不支持 multipart；请注入支持 FormData 的 fetch',
      );
    }

    const method = (init.method ?? 'GET').toUpperCase() as NonNullable<
      RequestConfig['method']
    >;
    let body: unknown;
    if (typeof init.body === 'string' && init.body) {
      try {
        body = JSON.parse(init.body) as unknown;
      } catch {
        body = init.body;
      }
    }

    const payload = await adapter.request({
      url,
      method,
      headers: headersToRecord(init.headers),
      body,
    });

    const success = (payload as { success?: boolean } | null)?.success;
    const status = success === false ? 400 : 200;
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * 从 PlatformAdapter 配置 ossFile HTTP（R2-223）
 *
 * - JSON GET/POST：走 `platform.fetch`（RequestAdapter）
 * - FormData 上传：走 `uploadFetch`，默认回退全局 `fetch`
 */
export function configureOssFileFromPlatform(
  platform: PlatformAdapter,
  options: {
    uploadFetch?: OssFileFetchFn;
  } = {},
): void {
  const jsonFetch = createOssFileFetchFromAdapter(platform.fetch);
  const uploadFetch =
    options.uploadFetch ??
    (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined);

  configureOssFileHttp({
    fetch: async (url, init) => {
      if (isMultipartBody(init?.body ?? null)) {
        if (!uploadFetch) {
          throw new Error(
            '[ossFile] multipart 上传需要 uploadFetch 或浏览器 fetch 环境',
          );
        }
        return uploadFetch(url, { credentials: 'include', ...init });
      }
      return jsonFetch(url, init);
    },
  });
}

export function getOssFileFetch(override?: OssFileFetchFn): OssFileFetchFn {
  const fn = override ?? globalHttpConfig.fetch;
  if (fn) {
    return fn;
  }
  if (typeof fetch === 'undefined') {
    throw new Error(
      '[ossFile] 无可用 fetch；请先调用 configureOssFileHttp 或 configureOssFileFromPlatform',
    );
  }
  return fetch.bind(globalThis);
}

export async function ossFileFetch(
  url: string,
  init?: RequestInit,
  override?: OssFileFetchFn,
): Promise<Response> {
  return getOssFileFetch(override)(url, {
    credentials: 'include',
    ...init,
  });
}
