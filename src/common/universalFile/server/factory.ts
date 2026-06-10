/**
 * UniversalFile Service 工厂函数
 * 提供简化的服务初始化方式
 */

import type {
  UniversalFileServiceConfig,
  StorageConfig,
  LocalStorageConfig,
  AliyunOSSConfig,
} from './types';

/**
 * 创建文件服务配置（带智能默认值）
 */
export function createFileServiceConfig(
  options: Partial<UniversalFileServiceConfig> & {
    storage: StorageConfig | 'local';
  }
): UniversalFileServiceConfig {
  // 处理简化的 storage 配置
  let storage: StorageConfig;

  if (options.storage === 'local') {
    storage = {
      type: 'local',
      enabled: true,
      rootPath: process.env.UPLOAD_DIR || './uploads',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    } as LocalStorageConfig;
  } else {
    storage = options.storage;
  }

  return {
    storage,
    cdn: options.cdn,
    cache: options.cache || {
      enabled: false,
    },
    processors: options.processors || [],
    db: options.db,
    maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: options.allowedMimeTypes || [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
    ],
    enableMonitoring: options.enableMonitoring !== false,
  };
}

/**
 * 创建文件服务实例（简化版）
 *
 * @example
 * ```typescript
 * // 最简配置 - 使用本地存储
 * const service = createUniversalFileService({ storage: 'local' });
 *
 * // 标准配置 - 使用阿里云 OSS
 * const service = createUniversalFileService({
 *   storage: {
 *     type: 'aliyun-oss',
 *     config: {
 *       accessKeyId: process.env.OSS_KEY!,
 *       accessKeySecret: process.env.OSS_SECRET!,
 *       bucket: process.env.OSS_BUCKET!,
 *       region: process.env.OSS_REGION!,
 *     },
 *   },
 *   db: drizzleDb,
 * });
 * ```
 */
export function createUniversalFileService(
  options: Partial<UniversalFileServiceConfig> & {
    storage: StorageConfig | 'local';
  }
) {
  const config = createFileServiceConfig(options);

  // 注意：实际的 UniversalFileService 将在后续 Phase 迁移
  // 这里先返回一个占位对象，包含基本的类型信息
  console.warn(
    '⚠️  UniversalFileService 的完整实现将在后续 Phase 中迁移到 Sa2kit。\n' +
    '    当前版本仅包含类型定义和配置工厂函数。\n' +
    '    请暂时继续从 LyricNote 的 lib/universalFile 导入服务类。'
  );

  return {
    config,
    // 占位方法
    async upload() {
      throw new Error('UniversalFileService 尚未完全迁移，请从 LyricNote 导入');
    },
    async download() {
      throw new Error('UniversalFileService 尚未完全迁移，请从 LyricNote 导入');
    },
  };
}

/**
 * 从环境变量创建配置（便利函数）
 *
 * @example
 * ```typescript
 * // .env
 * // STORAGE_TYPE=aliyun-oss
 * // OSS_ACCESS_KEY_ID=xxx
 * // OSS_ACCESS_KEY_SECRET=xxx
 * // OSS_BUCKET=my-bucket
 * // OSS_REGION=oss-cn-hangzhou
 *
 * const service = createFileServiceFromEnv();
 * ```
 */
export function createFileServiceFromEnv(db?: any) {
  const storageType = process.env.STORAGE_TYPE || 'local';

  let storage: StorageConfig;

  switch (storageType) {
    case 'local':
      storage = {
        type: 'local',
        enabled: true,
        rootPath: process.env.UPLOAD_DIR || './uploads',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      } as LocalStorageConfig;
      break;

    case 'aliyun-oss':
      if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
        throw new Error('Missing required OSS environment variables');
      }
      storage = {
        type: 'aliyun-oss',
        enabled: true,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET!,
        region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      } as AliyunOSSConfig;
      break;

    default:
      throw new Error('Unsupported storage type: ' + (storageType));
  }

  return createUniversalFileService({
    storage,
    db,
  });
}

