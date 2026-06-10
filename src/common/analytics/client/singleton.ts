/**
 * Analytics 单例管理器
 * Analytics Singleton Manager
 *
 * 提供统一的单例创建和管理功能，支持多个独立实例
 */

import { Analytics } from '../core/Analytics';
import type { AnalyticsConfig } from '../types';

// 存储多个实例的 Map
const instances = new Map<string, Analytics>();

/**
 * 创建或获取 Analytics 实例
 * @param instanceKey 实例唯一标识
 * @param config Analytics 配置
 * @returns Analytics 实例
 */
export function createAnalytics(instanceKey: string, config: AnalyticsConfig): Analytics {
  if (!instances.has(instanceKey)) {
    instances.set(instanceKey, new Analytics(config));
  }
  return instances.get(instanceKey)!;
}

/**
 * 获取已存在的 Analytics 实例
 * @param instanceKey 实例唯一标识
 * @returns Analytics 实例或 null
 */
export function getAnalyticsInstance(instanceKey: string): Analytics | null {
  return instances.get(instanceKey) || null;
}

/**
 * 重置指定实例
 * @param instanceKey 实例唯一标识
 */
export function resetAnalytics(instanceKey: string): void {
  instances.delete(instanceKey);
}

/**
 * 重置所有实例
 */
export function resetAllAnalytics(): void {
  instances.clear();
}

/**
 * 检查实例是否已初始化
 * @param instanceKey 实例唯一标识
 */
export function isAnalyticsInitialized(instanceKey: string): boolean {
  return instances.has(instanceKey);
}

/**
 * 获取所有已创建的实例键名
 */
export function getAllInstanceKeys(): string[] {
  return Array.from(instances.keys());
}
