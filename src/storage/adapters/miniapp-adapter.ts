/**
 * 小程序平台存储适配器 (wx.storage / Taro.storage)
 */

import type { StorageAdapter } from '../types';

// 尝试导入 Taro
let Taro: any = null;

try {
  Taro = require('@tarojs/taro').default;
} catch (e) {
  // Taro 不可用（非小程序环境）
}

export class MiniAppStorageAdapter implements StorageAdapter {
  private listeners: Map<string, Set<(key: string, value: string | null) => void>> = new Map();

  async getItem(key: string): Promise<string | null> {
    if (!Taro) return null;

    try {
      const result = await Taro.getStorage({ key });
      return result.data;
    } catch (error: any) {
      // 如果 key 不存在，Taro 会抛出错误
      if (error.errMsg?.includes('data not found')) {
        return null;
      }
      console.error(`[MiniAppStorage] Error getting item "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!Taro) {
      throw new Error('Taro is not available');
    }

    try {
      await Taro.setStorage({ key, data: value });
      this.notifyListeners(key, value);
    } catch (error) {
      console.error(`[MiniAppStorage] Error setting item "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!Taro) {
      throw new Error('Taro is not available');
    }

    try {
      await Taro.removeStorage({ key });
      this.notifyListeners(key, null);
    } catch (error) {
      console.error(`[MiniAppStorage] Error removing item "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!Taro) {
      throw new Error('Taro is not available');
    }

    try {
      await Taro.clearStorage();
    } catch (error) {
      console.error('[MiniAppStorage] Error clearing storage:', error);
      throw error;
    }
  }

  addChangeListener(callback: (key: string, value: string | null) => void): () => void {
    // 小程序没有原生的存储监听，我们使用内存中的监听器
    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }

    this.listeners.get('*')!.add(callback);

    // 返回清理函数
    return () => {
      this.listeners.get('*')?.delete(callback);
    };
  }

  private notifyListeners(key: string, value: string | null): void {
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach((callback) => callback(key, value));
    }
  }
}

