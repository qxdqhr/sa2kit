'use client';

/**
 * Electron 桌面端 Storage Hook
 * 基于通用 useStorage 的便捷封装
 */

import { useStorage } from './useStorage';
import { ElectronStorageAdapter } from '../adapters/electron-adapter';

// 创建单例适配器
const electronStorage = new ElectronStorageAdapter();

/**
 * Electron 桌面端的 Storage Hook
 *
 * 在 Electron 渲染进程中使用 localStorage
 * 支持跨窗口同步
 *
 * @param key - 存储键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, removeValue, isLoading]
 *
 * @example
 * ```tsx
 * const [token, setToken, removeToken] = useElectronStorage('auth-token', '')
 * ```
 */
export function useElectronStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean] {
  return useStorage(electronStorage, key, defaultValue);
}

