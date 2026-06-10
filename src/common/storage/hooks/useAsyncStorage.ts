'use client';

/**
 * React Native AsyncStorage Hook
 * 基于通用 useStorage 的便捷封装
 */

import { useStorage } from './useStorage';
import { ReactNativeStorageAdapter } from '../adapters/react-native-adapter';

// 创建单例适配器
const asyncStorage = new ReactNativeStorageAdapter();

/**
 * React Native 的 AsyncStorage Hook
 *
 * @param key - 存储键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, removeValue, isLoading]
 */
export function useAsyncStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean] {
  return useStorage(asyncStorage, key, defaultValue);
}

