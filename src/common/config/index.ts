/**
 * Config 配置管理模块
 *
 * 提供配置缓存和管理相关的 Hooks
 *
 * 依赖：swr
 */

// 类型定义
export type {
  ConfigItem,
  AllConfigs,
  UseConfigsOptions,
} from './types';

// Hooks
export {
  createUseConfigs,
  prefetchConfigs,
  invalidateAllConfigs,
} from './hooks';

