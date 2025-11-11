/**
 * UniversalFile 配置验证
 */

import type { UniversalFileServiceConfig, StorageConfig } from './types';

export class ConfigValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 验证存储配置
 */
export function validateStorageConfig(storage: StorageConfig): void {
  if (!storage.type) {
    throw new ConfigValidationError('Storage type is required', 'storage.type');
  }

  switch (storage.type) {
    case 'local': {
      const config = storage as any;
      if (!config.rootPath) {
        throw new ConfigValidationError(
          'rootPath is required for local storage',
          'storage.rootPath'
        );
      }
      if (!config.baseUrl) {
        throw new ConfigValidationError(
          'baseUrl is required for local storage',
          'storage.baseUrl'
        );
      }
      break;
    }

    case 'aliyun-oss': {
      const config = storage as any;
      if (!config.accessKeyId) {
        throw new ConfigValidationError(
          'accessKeyId is required for Aliyun OSS',
          'storage.accessKeyId'
        );
      }
      if (!config.accessKeySecret) {
        throw new ConfigValidationError(
          'accessKeySecret is required for Aliyun OSS',
          'storage.accessKeySecret'
        );
      }
      if (!config.bucket) {
        throw new ConfigValidationError(
          'bucket is required for Aliyun OSS',
          'storage.bucket'
        );
      }
      break;
    }

    default:
      throw new ConfigValidationError(
        `Unsupported storage type: ${storage.type}`,
        'storage.type'
      );
  }
}

/**
 * 验证完整的服务配置
 */
export function validateServiceConfig(config: UniversalFileServiceConfig): void {
  // 验证存储配置
  if (!config.storage) {
    throw new ConfigValidationError('Storage config is required', 'storage');
  }
  validateStorageConfig(config.storage);

  // 验证文件大小限制
  if (config.maxFileSize && config.maxFileSize <= 0) {
    throw new ConfigValidationError(
      'maxFileSize must be greater than 0',
      'maxFileSize'
    );
  }

  // 验证 MIME 类型
  if (config.allowedMimeTypes && config.allowedMimeTypes.length === 0) {
    throw new ConfigValidationError(
      'allowedMimeTypes must not be empty',
      'allowedMimeTypes'
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
      `Missing required environment variables: ${missing.join(', ')}`,
      'environment'
    );
  }
}

/**
 * 获取环境变量所需的变量列表（根据存储类型）
 */
export function getRequiredEnvVars(storageType: string): string[] {
  switch (storageType) {
    case 'local':
      return ['UPLOAD_DIR', 'BASE_URL'];
    case 'aliyun-oss':
      return [
        'OSS_ACCESS_KEY_ID',
        'OSS_ACCESS_KEY_SECRET',
        'OSS_BUCKET',
        'OSS_REGION',
      ];
    default:
      return [];
  }
}

