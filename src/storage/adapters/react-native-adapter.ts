/**
 * React Native 平台存储适配器 (AsyncStorage)
 */

import type { StorageAdapter } from '../types';

// 动态导入 AsyncStorage（避免在非 RN 环境报错）
let AsyncStorage: any = null;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage 不可用（非 React Native 环境）
  // 这是正常的，不需要警告
}

export class ReactNativeStorageAdapter implements StorageAdapter {
  private listeners: Map<string, Set<(key: string, value: string | null) => void>> = new Map();

  async getItem(key: string): Promise<string | null> {
    if (!AsyncStorage) return null;

    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[ReactNativeStorage] Error getting item "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!AsyncStorage) {
      throw new Error('AsyncStorage is not available');
    }

    try {
      await AsyncStorage.setItem(key, value);
      this.notifyListeners(key, value);
    } catch (error) {
      console.error(`[ReactNativeStorage] Error setting item "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!AsyncStorage) {
      throw new Error('AsyncStorage is not available');
    }

    try {
      await AsyncStorage.removeItem(key);
      this.notifyListeners(key, null);
    } catch (error) {
      console.error(`[ReactNativeStorage] Error removing item "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!AsyncStorage) {
      throw new Error('AsyncStorage is not available');
    }

    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[ReactNativeStorage] Error clearing storage:', error);
      throw error;
    }
  }

  addChangeListener(callback: (key: string, value: string | null) => void): () => void {
    // React Native 没有原生的跨实例存储监听，我们使用内存中的监听器
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

