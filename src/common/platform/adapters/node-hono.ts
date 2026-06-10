import type { FilePickAdapter, PlatformAdapter } from '../types';
import type { RequestAdapter } from '../../request/types/types';
import type { StorageAdapter } from '../../storage/types';

/** 内存 storage，适用于无持久化需求的 Node / Hono SSR */
class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/** 基于全局 fetch 的 Node 请求适配器 */
class NodeFetchAdapter implements RequestAdapter {
  async request<T>(config: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, unknown>;
  }): Promise<T> {
    let fullUrl = config.url;
    if (config.params) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined && value !== null) {
          search.append(key, String(value));
        }
      }
      const qs = search.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }

    const response = await fetch(fullUrl, {
      method: config.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`[PlatformAdapter:node-hono] HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

const unsupportedFilePick: FilePickAdapter = {
  async pickFiles() {
    throw new Error('[PlatformAdapter:node-hono] filePick 需在宿主注入');
  },
};

/** Hono / Node API 官方 adapter 骨架（R2-222） */
export function createNodeHonoPlatformAdapter(
  overrides: Partial<Pick<PlatformAdapter, 'storage' | 'fetch' | 'filePick'>> = {},
): PlatformAdapter {
  return {
    storage: overrides.storage ?? new MemoryStorageAdapter(),
    fetch: overrides.fetch ?? new NodeFetchAdapter(),
    filePick: overrides.filePick ?? unsupportedFilePick,
  };
}
