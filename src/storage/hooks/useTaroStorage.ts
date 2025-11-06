'use client';

/**
 * 小程序 Taro Storage Hook
 * 基于通用 useStorage 的便捷封装
 */

import { useStorage } from './useStorage';
import { MiniAppStorageAdapter } from '../adapters/miniapp-adapter';

// 创建单例适配器
const taroStorage = new MiniAppStorageAdapter();

/**
 * 小程序的 Taro Storage Hook
 *
 * @param key - 存储键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, removeValue, isLoading]
 */
export function useTaroStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean] {
  return useStorage(taroStorage, key, defaultValue);
}

