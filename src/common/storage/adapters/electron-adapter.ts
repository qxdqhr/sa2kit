/**
 * Electron 桌面端存储适配器
 *
 * Electron 渲染进程可以使用 localStorage（和 Web 相同）
 * 但我们提供专门的适配器以支持未来可能的主进程存储需求
 */

import type { StorageAdapter } from '../types';

/**
 * 检查 localStorage 是否可用（Electron 渲染进程）
 */
const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export class ElectronStorageAdapter implements StorageAdapter {
  private listeners: Map<string, Set<(key: string, value: string | null) => void>> = new Map();

  async getItem(key: string): Promise<string | null> {
    // 非 Electron 或无 localStorage 环境返回 null
    if (!hasLocalStorage) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[ElectronStorage] Error getting item "' + (key) + '":', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // 非 Electron 或无 localStorage 环境静默忽略
    if (!hasLocalStorage) {
      return;
    }

    try {
      localStorage.setItem(key, value);
      this.notifyListeners(key, value);

      // 触发自定义事件（用于跨窗口同步）
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('electron-storage-change', {
            detail: { key, value },
          })
        );
      }
    } catch (error) {
      console.error('[ElectronStorage] Error setting item "' + (key) + '":', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!hasLocalStorage) {
      return;
    }

    try {
      localStorage.removeItem(key);
      this.notifyListeners(key, null);

      // 触发自定义事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('electron-storage-change', {
            detail: { key, value: null },
          })
        );
      }
    } catch (error) {
      console.error('[ElectronStorage] Error removing item "' + (key) + '":', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!hasLocalStorage) {
      return;
    }

    try {
      localStorage.clear();

      // 通知所有监听器
      this.listeners.forEach((listeners, key) => {
        listeners.forEach((listener) => {
          listener(key, null);
        });
      });

      // 触发自定义事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('electron-storage-change', {
            detail: { key: '*', value: null },
          })
        );
      }
    } catch (error) {
      console.error('[ElectronStorage] Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * 添加存储变化监听器
   * 支持跨 Electron 窗口同步
   */
  addChangeListener(listener: (key: string, newValue: string | null) => void): () => void {
    // 添加到监听器集合
    const allListeners = this.listeners.get('*') || new Set();
    allListeners.add(listener);
    this.listeners.set('*', allListeners);

    // Storage 事件监听（同源窗口）
    const storageHandler = (e: StorageEvent) => {
      if (e.key) {
        listener(e.key, e.newValue);
      }
    };

    // 自定义事件监听（Electron 窗口间通信）
    const customHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { key, value } = customEvent.detail;
      if (key === '*') {
        // clear 操作
        this.listeners.forEach((_, k) => listener(k, null));
      } else {
        listener(key, value);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', storageHandler);
      window.addEventListener('electron-storage-change', customHandler);
    }

    // 返回清理函数
    return () => {
      allListeners.delete(listener);
      if (allListeners.size === 0) {
        this.listeners.delete('*');
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', storageHandler);
        window.removeEventListener('electron-storage-change', customHandler);
      }
    };
  }

  removeChangeListener(listener: (key: string, newValue: string | null) => void): void {
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.delete(listener);
      if (allListeners.size === 0) {
        this.listeners.delete('*');
      }
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(key: string, value: string | null): void {
    // 通知特定 key 的监听器
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        listener(key, value);
      });
    }

    // 通知通配符监听器
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((listener) => {
        listener(key, value);
      });
    }
  }
}

