/**
 * UniversalExport Service 工厂函数
 * 提供简化的服务初始化方式
 */

import type { UniversalExportServiceConfig } from './types';

/**
 * 创建导出服务配置（带智能默认值）
 */
export function createExportServiceConfig(
  options: Partial<UniversalExportServiceConfig> = {}
): UniversalExportServiceConfig {
  return {
    db: options.db,
    exportDir: options.exportDir || process.env.EXPORT_DIR || './exports',
    tempDir: options.tempDir || process.env.TEMP_DIR || './temp',
    maxRows: options.maxRows || 100000, // 默认最多导出 10 万行
    enableStreaming: options.enableStreaming !== false, // 默认启用流式导出
    timeout: options.timeout || 300000, // 默认超时 5 分钟
  };
}

/**
 * 创建导出服务实例（简化版）
 *
 * @example
 * ```typescript
 * // 最简配置
 * const service = createUniversalExportService();
 *
 * // 标准配置
 * const service = createUniversalExportService({
 *   db: drizzleDb,
 *   exportDir: './exports',
 *   maxRows: 50000,
 * });
 * ```
 */
export function createUniversalExportService(
  options: Partial<UniversalExportServiceConfig> = {}
) {
  const config = createExportServiceConfig(options);

  // 注意：实际的 UniversalExportService 将在后续 Phase 中迁移
  // 这里先返回一个占位对象，包含基本的类型信息
  console.warn(
    '⚠️  UniversalExportService 的完整实现将在后续 Phase 中迁移到 Sa2kit。\n' +
    '    当前版本仅包含类型定义和配置工厂函数。\n' +
    '    请暂时继续从 LyricNote 的 lib/universalExport 导入服务类。'
  );

  return {
    config,
    // 占位方法
    async export() {
      throw new Error('UniversalExportService 尚未完全迁移，请从 LyricNote 导入');
    },
    async createTask() {
      throw new Error('UniversalExportService 尚未完全迁移，请从 LyricNote 导入');
    },
  };
}

/**
 * 从环境变量创建配置（便利函数）
 *
 * @example
 * ```typescript
 * // .env
 * // EXPORT_DIR=./exports
 * // EXPORT_MAX_ROWS=50000
 *
 * const service = createExportServiceFromEnv();
 * ```
 */
export function createExportServiceFromEnv(db?: any) {
  return createUniversalExportService({
    db,
    exportDir: process.env.EXPORT_DIR,
    tempDir: process.env.TEMP_DIR,
    maxRows: process.env.EXPORT_MAX_ROWS
      ? parseInt(process.env.EXPORT_MAX_ROWS)
      : undefined,
  });
}

