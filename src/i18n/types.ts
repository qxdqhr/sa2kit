/**
 * i18n 类型定义
 */

// 支持的语言
export type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP';

// 翻译键的类型（用于类型安全）
export type TranslationKey = string;

// 翻译值类型（支持嵌套）
export type TranslationValue = string | { [key: string]: TranslationValue };

// 翻译对象类型
export type Translations = {
  [key: string]: TranslationValue;
};

// 翻译资源类型
export type LocaleResources = {
  [locale in Locale]?: Translations;
};

// 翻译函数参数类型
export interface TranslateOptions {
  defaultValue?: string;
  count?: number;
  context?: Record<string, any>;
}

// 插值函数类型
export type InterpolateFunction = (template: string, data: Record<string, any>) => string;

// i18n 配置类型
export interface I18nConfig {
  locale: Locale;
  fallbackLocale?: Locale;
  resources: LocaleResources;
  interpolate?: InterpolateFunction;
}

// i18n 实例接口
export interface I18nInstance {
  locale: Locale;
  t: (key: string, options?: TranslateOptions) => string;
  setLocale: (locale: Locale) => void;
  addResources: (locale: Locale, resources: Translations) => void;
  getLocale: () => Locale;
}

// 平台适配器接口
export interface I18nAdapter {
  getSystemLocale: () => Locale;
  saveLocale: (locale: Locale) => Promise<void>;
  loadLocale: () => Promise<Locale | null>;
}
