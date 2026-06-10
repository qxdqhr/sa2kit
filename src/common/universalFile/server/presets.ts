/**
 * UniversalFile 预设配置
 * 提供常见场景的开箱即用配置
 */

import type { StorageConfig, LocalStorageConfig, AliyunOSSConfig } from './types';

/**
 * 本地开发环境预设
 */
export function createLocalDevPreset(baseUrl = 'http://localhost:3000'): StorageConfig {
  return {
    type: 'local',
    enabled: true,
    rootPath: './uploads',
    baseUrl,
  } as LocalStorageConfig;
}

/**
 * 生产环境 OSS 预设
 */
export function createAliyunOSSPreset(config: {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region?: string;
}): StorageConfig {
  return {
    type: 'aliyun-oss',
    enabled: true,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    region: config.region || 'oss-cn-hangzhou',
  } as AliyunOSSConfig;
}

/**
 * 智能预设：根据环境自动选择
 */
export function createSmartPreset(): StorageConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && process.env.OSS_ACCESS_KEY_ID) {
    // 生产环境且配置了 OSS
    return createAliyunOSSPreset({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
      region: process.env.OSS_REGION,
    });
  }

  // 默认使用本地存储
  return createLocalDevPreset(process.env.BASE_URL);
}

/**
 * 图片服务预设（针对图片处理优化）
 */
export function createImageServicePreset(storage: StorageConfig) {
  return {
    storage,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  };
}

/**
 * 视频服务预设（针对大文件优化）
 */
export function createVideoServicePreset(storage: StorageConfig) {
  return {
    storage,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    enableStreaming: true,
  };
}

/**
 * 文档服务预设
 */
export function createDocumentServicePreset(storage: StorageConfig) {
  return {
    storage,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  };
}

