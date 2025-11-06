/**
 * Analytics 预设配置
 * Analytics Preset Configurations
 *
 * 提供常见场景的配置模板（不包含平台适配器）
 * 使用时需要提供具体的 adapter 实现
 */

import type { AnalyticsConfig } from '../types';

/**
 * Web 应用基础配置模板
 */
export function createWebConfig(
  appId: string,
  options: {
    endpoint?: string;
    debug?: boolean;
    enableAutoPageView?: boolean;
    appVersion?: string;
  } = {}
): Partial<AnalyticsConfig> {
  return {
    appId,
    appVersion: options.appVersion || '1.0.0',
    endpoint: options.endpoint || '/api/analytics/events',
    platform: 'web',
    enableAutoPageView: options.enableAutoPageView ?? true,
    debug:
      options.debug ??
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'),
    // adapter 需要由调用者提供
  };
}

/**
 * 移动应用基础配置模板
 */
export function createMobileConfig(
  appId: string,
  options: {
    endpoint?: string;
    debug?: boolean;
    appVersion?: string;
  } = {}
): Partial<AnalyticsConfig> {
  return {
    appId,
    appVersion: options.appVersion || '1.0.0',
    endpoint: options.endpoint || '/api/analytics/events',
    platform: 'mobile',
    enableAutoPageView: false,
    debug: options.debug ?? false,
    // adapter 需要由调用者提供
  };
}

/**
 * 小程序基础配置模板
 */
export function createMiniappConfig(
  appId: string,
  options: {
    endpoint?: string;
    debug?: boolean;
    appVersion?: string;
  } = {}
): Partial<AnalyticsConfig> {
  return {
    appId,
    appVersion: options.appVersion || '1.0.0',
    endpoint: options.endpoint || '/api/analytics/events',
    platform: 'miniapp',
    enableAutoPageView: true,
    debug: options.debug ?? false,
    // adapter 需要由调用者提供
  };
}

/**
 * 桌面应用基础配置模板
 */
export function createDesktopConfig(
  appId: string,
  options: {
    endpoint?: string;
    debug?: boolean;
    appVersion?: string;
  } = {}
): Partial<AnalyticsConfig> {
  return {
    appId,
    appVersion: options.appVersion || '1.0.0',
    endpoint: options.endpoint || '/api/analytics/events',
    platform: 'desktop',
    enableAutoPageView: false,
    debug: options.debug ?? false,
    // adapter 需要由调用者提供
  };
}

/**
 * 使用示例：
 *
 * ```typescript
 * import { createWebConfig, createAnalytics } from '@qhr123/sa2kit/analytics';
 * import { webAdapter } from './adapters/web'; // 你的适配器实现
 *
 * const config = createWebConfig('my-app', {
 *   endpoint: 'https://api.example.com/analytics',
 *   debug: true,
 * });
 *
 * const analytics = createAnalytics('my-instance', {
 *   ...config,
 *   adapter: webAdapter, // 提供具体的适配器
 * });
 * ```
 */
