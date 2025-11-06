/**
 * Web 平台 localStorage Hook
 * 基于通用 useStorage 的便捷封装
 */

import { useStorage } from './useStorage';
import { WebStorageAdapter } from '../adapters/web-adapter';

// 创建单例适配器
const webStorage = new WebStorageAdapter();

/**
 * Web 平台的 localStorage Hook
 *
 * @param key - 存储键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, removeValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean] {
  return useStorage(webStorage, key, defaultValue);
}

