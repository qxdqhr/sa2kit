/**
 * Web 平台存储适配器 (localStorage)
 */

import type { StorageAdapter } from './types';

/**
 * 检查是否在浏览器环境中
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    // SSR 环境下返回 null
    if (!isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`[WebStorage] Error getting item "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // SSR 环境下静默忽略
    if (!isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`[WebStorage] Error setting item "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    // SSR 环境下静默忽略
    if (!isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[WebStorage] Error removing item "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // SSR 环境下静默忽略
    if (!isBrowser) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('[WebStorage] Error clearing storage:', error);
      throw error;
    }
  }

  addChangeListener(callback: (key: string, value: string | null) => void): () => void {
    // SSR 环境下返回空函数
    if (!isBrowser) {
      return () => {};
    }

    // 监听 storage 事件（跨标签页）
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key) {
        callback(e.key, e.newValue);
      }
    };

    // 监听自定义事件（同标签页）
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail.key, customEvent.detail.value);
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('local-storage-change', handleCustomEvent);

    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('local-storage-change', handleCustomEvent);
    };
  }

  /**
   * 触发自定义事件，通知同标签页的其他组件
   */
  dispatchChange(key: string, value: string | null): void {
    // SSR 环境下静默忽略
    if (!isBrowser) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('local-storage-change', {
        detail: { key, value },
      })
    );
  }
}

