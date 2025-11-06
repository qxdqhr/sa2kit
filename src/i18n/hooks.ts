/**
 * React hooks for i18n
 */

import { useState, useCallback } from 'react';
import { getI18n } from './i18n';
import type { Locale, TranslateOptions } from './types';

/**
 * useTranslation Hook
 * React 组件中使用翻译
 */
export function useTranslation() {
  const i18n = getI18n();
  const [locale, setLocaleState] = useState<Locale>(i18n.getLocale());

  // 翻译函数
  const t = useCallback(
    (key: string, options?: TranslateOptions): string => {
      return i18n.t(key, options);
    },
    [locale] // locale 改变时重新创建函数
  );

  // 切换语言
  const setLocale = useCallback((newLocale: Locale) => {
    i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    t,
    locale,
    setLocale,
  };
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
