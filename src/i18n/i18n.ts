/**
 * 轻量级 i18n 核心实现
 * 支持：翻译、插值、复数、嵌套键、类型安全
 */

import type {
  Locale,
  Translations,
  LocaleResources,
  TranslateOptions,
  I18nConfig,
  I18nInstance,
} from './types';

/**
 * 默认插值函数
 * 支持 {{key}} 格式的变量替换
 */
function defaultInterpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() ?? match;
  });
}

/**
 * 从嵌套对象中获取值
 * 支持 "user.name" 这样的路径
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }

  return result;
}

/**
 * 创建 i18n 实例
 */
export function createI18n(config: I18nConfig): I18nInstance {
  let currentLocale: Locale = config.locale;
  const fallbackLocale: Locale = config.fallbackLocale || 'zh-CN';
  const resources: LocaleResources = config.resources || {};
  const interpolate = config.interpolate || defaultInterpolate;

  /**
   * 翻译函数
   * @param key 翻译键，支持嵌套 "common.hello"
   * @param options 选项
   */
  function t(key: string, options: TranslateOptions = {}): string {
    const { defaultValue, count, context = {} } = options;

    // 获取当前语言的翻译
    let translation = getNestedValue(resources[currentLocale], key);

    // 如果没有找到，尝试使用 fallback 语言
    if (translation === undefined && currentLocale !== fallbackLocale) {
      translation = getNestedValue(resources[fallbackLocale], key);
    }

    // 如果还是没有找到，使用默认值或键名
    if (translation === undefined) {
      return defaultValue || key;
    }

    // 如果不是字符串，返回 JSON 字符串
    if (typeof translation !== 'string') {
      return JSON.stringify(translation);
    }

    // 处理复数
    if (count !== undefined) {
      const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
      const pluralTranslation = getNestedValue(resources[currentLocale], pluralKey);
      if (pluralTranslation && typeof pluralTranslation === 'string') {
        translation = pluralTranslation;
      }
    }

    // 插值
    const data = { ...context, count };
    return interpolate(translation, data);
  }

  /**
   * 设置当前语言
   */
  function setLocale(locale: Locale): void {
    currentLocale = locale;
  }

  /**
   * 添加翻译资源
   */
  function addResources(locale: Locale, newResources: Translations): void {
    if (!resources[locale]) {
      resources[locale] = {};
    }
    resources[locale] = {
      ...resources[locale],
      ...newResources,
    };
  }

  /**
   * 获取当前语言
   */
  function getLocale(): Locale {
    return currentLocale;
  }

  return {
    locale: currentLocale,
    t,
    setLocale,
    addResources,
    getLocale,
  };
}

/**
 * 全局 i18n 实例（可选）
 */
let globalI18n: I18nInstance | null = null;

/**
 * 初始化全局 i18n
 */
export function initI18n(config: I18nConfig): I18nInstance {
  globalI18n = createI18n(config);
  return globalI18n;
}

/**
 * 获取全局 i18n 实例
 */
export function getI18n(): I18nInstance {
  if (!globalI18n) {
    throw new Error('i18n not initialized. Call initI18n() first.');
  }
  return globalI18n;
}

/**
 * 快捷翻译函数
 */
export function t(key: string, options?: TranslateOptions): string {
  return getI18n().t(key, options);
}
