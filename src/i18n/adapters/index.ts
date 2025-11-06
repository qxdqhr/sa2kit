/**
 * 平台适配器导出
 * Platform Adapters Exports
 *
 * 提供不同平台的 i18n 适配器实现
 */

// Web 平台适配器
export { WebI18nAdapter } from './web';

// Mobile 平台适配器 (React Native)
export { ReactNativeI18nAdapter } from './mobile';

// 小程序平台适配器 (Taro)
export { TaroI18nAdapter } from './miniapp';

// 桌面应用适配器 (Electron)
export { ElectronI18nAdapter } from './desktop';

