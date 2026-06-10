/**
 * UniversalExport 配置验证
 */

import type { UniversalExportServiceConfig } from './types';

export class ConfigValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 验证导出服务配置
 */
export function validateExportConfig(config: UniversalExportServiceConfig): void {
  // 验证导出目录
  if (!config.exportDir) {
    throw new ConfigValidationError('exportDir is required', 'exportDir');
  }

  // 验证临时目录
  if (!config.tempDir) {
    throw new ConfigValidationError('tempDir is required', 'tempDir');
  }

  // 验证最大行数
  if (config.maxRows && config.maxRows <= 0) {
    throw new ConfigValidationError(
      'maxRows must be greater than 0',
      'maxRows'
    );
  }

  // 验证超时时间
  if (config.timeout && config.timeout <= 0) {
    throw new ConfigValidationError(
      'timeout must be greater than 0',
      'timeout'
    );
  }

  // 安全建议
  if (config.maxRows && config.maxRows > 1000000) {
    console.warn(
      '⚠️  Warning: maxRows (' + (config.maxRows) + ') is very large. ' +
      `Consider using pagination or streaming for better performance.`
    );
  }
}

/**
 * 验证环境变量
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new ConfigValidationError(
      'Missing required environment variables: ' + (missing.join(', ')),
      'environment'
    );
  }
}

