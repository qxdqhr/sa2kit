/**
 * 通用存储 Hook
 * 支持多平台：Web、React Native、小程序
 *
 * 优点：
 * 1. 异步读取，不阻塞渲染
 * 2. 统一的错误处理
 * 3. 类型安全
 * 4. 跨平台支持
 * 5. 自动同步（支持的平台）
 */

import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../storage/types';

export function useStorage<T>(
  storage: StorageAdapter,
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // 初始化时从存储读取
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await storage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Error reading storage key "${key}":`, error);
      } finally {
        setLoading(false);
      }
    };

    void loadValue();
  }, [storage, key]);

  // 更新值并同步到存储
  const updateValue = useCallback(
    async (newValue: T) => {
      try {
        setValue(newValue);
        await storage.setItem(key, JSON.stringify(newValue));

        // 如果是 Web 适配器，触发自定义事件
        if ('dispatchChange' in storage && typeof storage.dispatchChange === 'function') {
          (storage as any).dispatchChange(key, JSON.stringify(newValue));
        }
      } catch (error) {
        console.error(`Error setting storage key "${key}":`, error);
      }
    },
    [storage, key]
  );

  // 删除值
  const removeValue = useCallback(async () => {
    try {
      setValue(defaultValue);
      await storage.removeItem(key);

      // 如果是 Web 适配器，触发自定义事件
      if ('dispatchChange' in storage && typeof storage.dispatchChange === 'function') {
        (storage as any).dispatchChange(key, null);
      }
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  }, [storage, key, defaultValue]);

  // 监听存储变化
  useEffect(() => {
    if (!storage.addChangeListener) {
      return;
    }

    const cleanup = storage.addChangeListener((changedKey: string, newValue: string | null) => {
      if (changedKey === key) {
        try {
          if (newValue === null) {
            setValue(defaultValue);
          } else {
            setValue(JSON.parse(newValue));
          }
        } catch (error) {
          console.error('Error parsing storage change event:', error);
        }
      }
    });

    return cleanup;
  }, [storage, key, defaultValue]);

  return [value, updateValue, removeValue, loading];
}

