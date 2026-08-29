import { useCallback, useEffect, useState } from 'react';

/** UI 包内自包含 localStorage hook（避免发布源码依赖未打包的 storage 目录） */
export function useWebLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private mode */
    }
  }, [key, value]);

  const setValue = useCallback((next: T) => {
    setValueState(next);
  }, []);

  return [value, setValue];
}
