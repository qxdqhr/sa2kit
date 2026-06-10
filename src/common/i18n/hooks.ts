/**
 * React hooks for i18n
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getI18n } from './i18n';
import type { Locale, TranslateOptions } from './types';

/**
 * useTranslation Hook
 * React 组件中使用翻译
 * 支持 SSR 环境，在 i18n 未初始化时安全降级
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('zh-CN');
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    // 仅在客户端尝试获取 i18n 实例
    if (typeof window !== 'undefined') {
      try {
        const i18n = getI18n();
        setI18nInstance(i18n);
        setLocaleState(i18n.getLocale());
      } catch {
        // i18n 未初始化，保持 null
        console.warn('i18n not initialized. Some translations may not work.');
      }
    }
  }, []);

  // 翻译函数
  const t = useCallback(
    (key: string, options?: TranslateOptions): string => {
      if (i18nInstance) {
        return i18nInstance.t(key, options);
      }
      // 未初始化时返回 key 作为后备
      return key;
    },
    [i18nInstance]
  );

  // 切换语言
  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (i18nInstance) {
        i18nInstance.setLocale(newLocale);
        setLocaleState(newLocale);
      } else {
        console.warn('i18n not initialized. Cannot change locale.');
      }
    },
    [i18nInstance]
  );

  return useMemo(
    () => ({
      t,
      locale,
      setLocale,
    }),
    [t, locale, setLocale]
  );
}

/**
 * useLocale Hook
 * 只获取和设置语言，不包含翻译函数
 */
export function useLocale() {
  const i18n = getI18n();
  const [locale, setLocaleState] = useState<Locale>(i18n.getLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    locale,
    setLocale,
  };
}
