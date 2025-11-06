/**
 * i18n 国际化模块
 *
 * 提供完整的国际化解决方案，支持多语言切换、动态加载、React Hooks 和 UI 组件
 */

// 核心功能
export { createI18n, initI18n, getI18n, t } from './i18n';

// 类型定义
export type {
  Locale,
  TranslationKey,
  TranslationValue,
  Translations,
  LocaleResources,
  TranslateOptions,
  I18nConfig,
  I18nInstance,
  I18nAdapter,
} from './types';

// React Hooks
export { useTranslation, useLocale } from './hooks';

// 示例翻译资源
export { default as zhCN } from './locales/zh-CN';
export { default as enUS } from './locales/en-US';

// 平台适配器
export * from './adapters';

// UI 组件（Tailwind CSS）
export * from './components';
