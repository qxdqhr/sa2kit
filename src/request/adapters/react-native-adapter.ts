import type { RequestAdapter, RequestConfig } from '../types/types';

/**
 * React Native 请求适配器（fetch，不携带 Cookie）
 * 与 WebRequestAdapter 的区别：RN 跨域场景下 credentials:include 无效且易误导
 */
export class ReactNativeRequestAdapter implements RequestAdapter {
  async request<T = unknown>(config: RequestConfig): Promise<T> {
    const { url, method = 'GET', headers = {}, body, params } = config;

    let fullUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        fullUrl += url.includes('?') ? `&${qs}` : `?${qs}`;
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) {
      return {
        success: false,
        error:
          (data as { error?: string }).error ??
          `请求失败 (${response.status})`,
      } as T;
    }
    return data;
  }
}
