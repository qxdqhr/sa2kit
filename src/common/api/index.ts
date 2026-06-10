/**
 * API 模块
 * API Module
 *
 * 提供通用的 API 客户端基类和类型定义
 */

export * from './types';
export * from './BaseApiClient';

// 重新导出依赖的适配器类型，方便使用
export type { StorageAdapter } from '../storage';
export type { RequestAdapter, RequestConfig } from '../request';

// 导出常用的默认配置
export { DEFAULT_STORAGE_KEYS, DEFAULT_API_ROUTES } from './types';

