/**
 * UniversalExport 预设配置
 * 提供常见场景的开箱即用配置
 */

import type { UniversalExportServiceConfig } from './types';

/**
 * 小型应用预设（数据量小）
 */
export function createSmallAppPreset(): Partial<UniversalExportServiceConfig> {
  return {
    maxRows: 10000, // 1万行
    timeout: 60000, // 1分钟
    enableStreaming: false, // 小数据量不需要流式导出
  };
}

/**
 * 中型应用预设（默认配置）
 */
export function createMediumAppPreset(): Partial<UniversalExportServiceConfig> {
  return {
    maxRows: 100000, // 10万行
    timeout: 300000, // 5分钟
    enableStreaming: true,
  };
}

/**
 * 大型应用预设（数据量大）
 */
export function createLargeAppPreset(): Partial<UniversalExportServiceConfig> {
  return {
    maxRows: 1000000, // 100万行
    timeout: 600000, // 10分钟
    enableStreaming: true,
  };
}

/**
 * 实时导出预设（快速响应）
 */
export function createRealtimeExportPreset(): Partial<UniversalExportServiceConfig> {
  return {
    maxRows: 5000, // 5千行
    timeout: 30000, // 30秒
    enableStreaming: false,
  };
}

/**
 * 批量导出预设（大批量、离线处理）
 */
export function createBatchExportPreset(): Partial<UniversalExportServiceConfig> {
  return {
    maxRows: Number.MAX_SAFE_INTEGER, // 不限制
    timeout: 1800000, // 30分钟
    enableStreaming: true,
  };
}

/**
 * 智能预设：根据环境自动选择
 */
export function createSmartExportPreset(): Partial<UniversalExportServiceConfig> {
  const envMaxRows = process.env.EXPORT_MAX_ROWS;

  if (envMaxRows) {
    const maxRows = parseInt(envMaxRows);

    // 根据配置的最大行数自动选择合适的预设
    if (maxRows <= 10000) {
      return createSmallAppPreset();
    } else if (maxRows <= 100000) {
      return createMediumAppPreset();
    } else {
      return createLargeAppPreset();
    }
  }

  // 默认使用中型应用预设
  return createMediumAppPreset();
}

