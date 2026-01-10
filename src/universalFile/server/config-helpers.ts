/**
 * 文件服务配置加载辅助工具
 *
 * 提供从环境变量加载配置、默认配置常量等通用功能
 */

import type {
  UniversalFileServiceConfig,
  AliyunOSSConfig,
  AliyunCDNConfig,
  LocalStorageConfig,
  StorageConfig,
  CDNConfig,
} from './types';
import { UniversalFileService } from './UniversalFileService';
import { createLogger } from '../../logger';

const logger = createLogger('FileConfigHelpers');

// ==================== 默认配置常量 ====================

/**
 * 默认文件大小限制（字节）
 */
export const DEFAULT_MAX_FILE_SIZE = 104857600; // 100MB

/**
 * 默认允许的 MIME 类型
 */
export const DEFAULT_ALLOWED_MIME_TYPES = [
  // 图片类型
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  // 音频类型
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/webm',
  'audio/flac',
  // 视频类型
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/webm',
  'video/mkv',
  'video/mpeg',
  'video/quicktime',
  // 文档类型
  'application/pdf',
  'text/plain',
  'application/json',
  'application/javascript',
  'text/css',
  'text/html',
  'text/markdown',
  'application/xml',
  'text/xml',
  // Office 文档
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 压缩文件
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // 3D模型文件
  'application/octet-stream',
  'model/gltf+json',
  'model/gltf-binary',
  'model/obj',
  'model/fbx',
];

/**
 * 默认缓存配置
 */
export const DEFAULT_CACHE_CONFIG = {
  enabled: false,
  metadataTTL: 3600, // 1小时
  urlTTL: 1800, // 30分钟
};

/**
 * 默认文件服务配置
 */
export const DEFAULT_FILE_SERVICE_CONFIG = {
  maxFileSize: DEFAULT_MAX_FILE_SIZE,
  allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES,
  cache: DEFAULT_CACHE_CONFIG,
  enableMonitoring: false,
} as const;

// ==================== 环境变量配置加载 ====================

/**
 * 从环境变量加载阿里云 OSS 配置
 *
 * 支持的环境变量：
 * - ALIYUN_OSS_REGION
 * - ALIYUN_OSS_BUCKET
 * - ALIYUN_OSS_ACCESS_KEY_ID
 * - ALIYUN_OSS_ACCESS_KEY_SECRET
 * - ALIYUN_OSS_CUSTOM_DOMAIN (可选)
 * - ALIYUN_OSS_SECURE (可选，默认 false)
 * - ALIYUN_OSS_INTERNAL (可选，默认 false)
 */
export function loadOSSConfigFromEnv(): AliyunOSSConfig | null {
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

  // 验证必需字段
  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    logger.debug('OSS 环境变量配置不完整', {
      hasRegion: !!region,
      hasBucket: !!bucket,
      hasAccessKeyId: !!accessKeyId,
      hasAccessKeySecret: !!accessKeySecret,
    });
    return null;
  }

  const config: AliyunOSSConfig = {
    type: 'aliyun-oss',
    enabled: true,
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    customDomain: process.env.ALIYUN_OSS_CUSTOM_DOMAIN,
    secure: process.env.ALIYUN_OSS_SECURE === 'true',
    internal: process.env.ALIYUN_OSS_INTERNAL === 'true',
  };

  logger.info('✅ 从环境变量加载 OSS 配置成功', {
    region: config.region,
    bucket: config.bucket,
    hasCustomDomain: !!config.customDomain,
  });

  return config;
}

/**
 * 从环境变量加载阿里云 CDN 配置
 *
 * 支持的环境变量：
 * - ALIYUN_CDN_DOMAIN
 * - ALIYUN_CDN_ACCESS_KEY_ID
 * - ALIYUN_CDN_ACCESS_KEY_SECRET
 * - ALIYUN_CDN_REGION (可选)
 */
export function loadCDNConfigFromEnv(): AliyunCDNConfig | null {
  const domain = process.env.ALIYUN_CDN_DOMAIN;
  const accessKeyId = process.env.ALIYUN_CDN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_CDN_ACCESS_KEY_SECRET;

  // CDN 配置是可选的
  if (!domain || !accessKeyId || !accessKeySecret) {
    logger.debug('CDN 环境变量未配置或不完整');
    return null;
  }

  const config: AliyunCDNConfig = {
    type: 'aliyun-cdn',
    enabled: true,
    domain,
    accessKeyId,
    accessKeySecret,
    region: process.env.ALIYUN_CDN_REGION,
  };

  logger.info('✅ 从环境变量加载 CDN 配置成功', {
    domain: config.domain,
  });

  return config;
}

/**
 * 获取默认本地存储配置
 *
 * 支持的环境变量：
 * - FILE_STORAGE_PATH (可选，默认 'uploads')
 * - FILE_BASE_URL (可选，默认 '/uploads')
 */
export function getDefaultLocalStorage(): LocalStorageConfig {
  return {
    type: 'local',
    enabled: true,
    rootPath: process.env.FILE_STORAGE_PATH || 'uploads',
    baseUrl: process.env.FILE_BASE_URL || '/uploads',
  };
}

/**
 * 从环境变量加载完整的文件服务配置
 *
 * 配置优先级：
 * 1. 阿里云 OSS（如果配置完整）
 * 2. 本地存储（备用方案）
 *
 * 支持的环境变量：
 * - MAX_FILE_SIZE (可选，默认 100MB)
 * - ENABLE_CACHE (可选，默认 false)
 * - METADATA_CACHE_TTL (可选，默认 3600秒)
 * - URL_CACHE_TTL (可选，默认 1800秒)
 * - ENABLE_FILE_MONITORING (可选，默认 false)
 */
export function loadConfigFromEnv(): Partial<UniversalFileServiceConfig> {
  logger.info('从环境变量加载文件服务配置...');

  // 1. 尝试加载 OSS 配置
  const ossConfig = loadOSSConfigFromEnv();

  // 2. 加载 CDN 配置（可选）
  const cdnConfig = loadCDNConfigFromEnv();

  // 3. 决定存储方式：优先 OSS，否则本地存储
  const storage: StorageConfig = ossConfig || getDefaultLocalStorage();
  const defaultStorage = ossConfig ? 'aliyun-oss' : 'local';

  logger.info(`使用存储方式: ${defaultStorage}`);

  // 4. 构建完整配置
  const config: Partial<UniversalFileServiceConfig> = {
    storage,
    defaultStorage,
    cdn: cdnConfig || undefined,
    defaultCDN: cdnConfig ? 'aliyun-cdn' : 'none',
    maxFileSize: process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE)
      : DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES,
    cache: {
      enabled: process.env.ENABLE_CACHE === 'true',
      metadataTTL: process.env.METADATA_CACHE_TTL
        ? parseInt(process.env.METADATA_CACHE_TTL)
        : DEFAULT_CACHE_CONFIG.metadataTTL,
      urlTTL: process.env.URL_CACHE_TTL
        ? parseInt(process.env.URL_CACHE_TTL)
        : DEFAULT_CACHE_CONFIG.urlTTL,
    },
    enableMonitoring: process.env.ENABLE_FILE_MONITORING === 'true',
  };

  logger.info('✅ 配置加载完成');

  return config;
}

// ==================== 配置加载器接口 ====================

/**
 * 配置服务接口
 *
 * 用于从配置管理系统加载配置
 */
export interface IConfigService {
  /**
   * 获取配置值
   */
  getConfig(key: string, defaultValue?: any): Promise<any>;
}

/**
 * 配置键映射
 */
export interface OSSConfigKeyMapping {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  customDomain?: string;
  secure?: string;
  internal?: string;
}

/**
 * 默认的 OSS 配置键映射（阿里云标准）
 */
export const DEFAULT_OSS_CONFIG_KEYS: OSSConfigKeyMapping = {
  region: 'aliyun_oss_region',
  bucket: 'aliyun_oss_bucket',
  accessKeyId: 'aliyun_oss_access_key_id',
  accessKeySecret: 'aliyun_oss_access_key_secret',
  customDomain: 'aliyun_oss_custom_domain',
  secure: 'aliyun_oss_secure',
  internal: 'aliyun_oss_internal',
};

/**
 * 从配置服务加载 OSS 配置
 *
 * 通用函数，可用于任何实现了 IConfigService 接口的配置系统
 *
 * @param configService - 配置服务实例
 * @param keyMapping - 配置键映射（可选，默认使用标准键名）
 *
 * @example
 * ```typescript
 * import { loadOSSConfigFromService } from 'sa2kit/universalFile/server';
 *
 * const config = await loadOSSConfigFromService(myConfigService, {
 *   region: 'oss_region',
 *   bucket: 'oss_bucket',
 *   // ...
 * });
 * ```
 */
export async function loadOSSConfigFromService(
  configService: IConfigService,
  keyMapping: Partial<OSSConfigKeyMapping> = DEFAULT_OSS_CONFIG_KEYS
): Promise<AliyunOSSConfig | null> {
  const logger = createLogger('loadOSSConfigFromService');

  try {
    const keys = { ...DEFAULT_OSS_CONFIG_KEYS, ...keyMapping };

    const [region, bucket, accessKeyId, accessKeySecret, customDomain, secure, internal] =
      await Promise.all([
        configService.getConfig(keys.region),
        configService.getConfig(keys.bucket),
        configService.getConfig(keys.accessKeyId),
        configService.getConfig(keys.accessKeySecret),
        configService.getConfig(keys.customDomain || ''),
        configService.getConfig(keys.secure || ''),
        configService.getConfig(keys.internal || ''),
      ]);

    if (!region || !bucket || !accessKeyId || !accessKeySecret) {
      logger.debug('配置服务中的 OSS 配置不完整');
      return null;
    }

    const config: AliyunOSSConfig = {
      type: 'aliyun-oss',
      enabled: true,
      region,
      bucket,
      accessKeyId,
      accessKeySecret,
      customDomain,
      secure: secure === 'true' || secure === true,
      internal: internal === 'true' || internal === true,
    };

    logger.info('✅ 从配置服务加载 OSS 配置成功');

    return config;
  } catch (error) {
    logger.warn('从配置服务加载 OSS 配置失败:', error);
    return null;
  }
}

/**
 * 组合多个配置源
 *
 * 按优先级顺序尝试加载配置，返回第一个成功的配置
 *
 * @param loaders - 配置加载器数组（按优先级排序）
 *
 * @example
 * ```typescript
 * const config = await loadConfigWithFallback([
 *   async () => loadOSSConfigFromService(configService),
 *   () => loadOSSConfigFromEnv(),
 * ]);
 * ```
 */
export async function loadConfigWithFallback<T>(
  loaders: Array<() => Promise<T | null>>
): Promise<T | null> {
  for (const loader of loaders) {
    try {
      const config = await loader();
      if (config) {
        return config;
      }
    } catch (error) {
      // 继续尝试下一个加载器
      continue;
    }
  }
  return null;
}

// ==================== 服务工厂 ====================

/**
 * 文件服务工厂选项
 */
export interface FileServiceFactoryOptions {
  /**
   * 配置加载器（按优先级排序）
   */
  configLoaders?: Array<() => Promise<Partial<UniversalFileServiceConfig> | null>>;

  /**
   * 持久化仓储（可选）
   */
  repository?: any;

  /**
   * 自定义配置（会覆盖加载的配置）
   */
  customConfig?: Partial<UniversalFileServiceConfig>;

  /**
   * 是否自动初始化服务
   */
  autoInitialize?: boolean;
}

/**
 * 创建文件服务（工厂函数）
 *
 * 通用的服务创建函数，支持多种配置源和可选的持久化
 *
 * @param options - 工厂选项
 *
 * @example
 * ```typescript
 * import {
 *   createFileServiceWithFactory,
 *   loadOSSConfigFromService,
 *   loadConfigFromEnv
 * } from 'sa2kit/universalFile/server';
 *
 * const service = await createFileServiceWithFactory({
 *   configLoaders: [
 *     async () => {
 *       const ossConfig = await loadOSSConfigFromService(configService);
 *       return ossConfig ? { storage: ossConfig, defaultStorage: 'aliyun-oss' } : null;
 *     },
 *     () => Promise.resolve(loadConfigFromEnv()),
 *   ],
 *   repository: myRepository,
 *   autoInitialize: true,
 * });
 * ```
 */
export async function createFileServiceWithFactory(
  options: FileServiceFactoryOptions = {}
): Promise<UniversalFileService> {
  const {
    configLoaders = [() => Promise.resolve(loadConfigFromEnv())],
    repository,
    customConfig,
    autoInitialize = false,
  } = options;

  const logger = createLogger('FileServiceFactory');

  logger.info('创建文件服务...');

  // 1. 加载配置（尝试所有配置加载器）
  let config: Partial<UniversalFileServiceConfig> | null = null;

  for (const loader of configLoaders) {
    try {
      const loadedConfig = await loader();
      if (loadedConfig) {
        config = loadedConfig;
        break;
      }
    } catch (error) {
      logger.warn('配置加载器失败:', error);
      continue;
    }
  }

  if (!config) {
    throw new Error('无法加载文件服务配置：所有配置源都失败');
  }

  // 2. 合并配置
  const finalConfig: Partial<UniversalFileServiceConfig> = {
    ...config,
    ...customConfig,
  };

  // 3. 添加持久化配置（如果提供）
  if (repository) {
    finalConfig.persistence = {
      enabled: true,
      repository,
      autoPersist: true,
    };
  }

  // 4. 创建服务
  const service = new UniversalFileService(finalConfig as UniversalFileServiceConfig);

  // 5. 可选的自动初始化
  if (autoInitialize) {
    try {
      await service.initialize();
      logger.info('✅ 文件服务创建并初始化完成');
    } catch (initError) {
      logger.warn('⚠️ 文件服务初始化失败，将提供延迟初始化的支持:', initError);

      // 返回服务实例，但标记为未完全初始化
      // 调用者可以稍后调用 reinitializeStorageProviders 来完成初始化
      logger.info('💡 提示：可调用 service.reinitializeStorageProviders() 来重新初始化存储提供者');
    }
  } else {
    logger.info('✅ 文件服务创建完成');
  }

  return service;
}

// ==================== 单例辅助函数 ====================

/**
 * 单例工厂返回值
 */
export interface SingletonFactory<T> {
  /**
   * 获取单例实例
   */
  get(): Promise<T>;

  /**
   * 重置单例（主要用于测试）
   */
  reset(): void;

  /**
   * 检查单例是否已创建
   */
  isCreated(): boolean;
}

/**
 * 创建单例工厂
 *
 * 提供单例模式的通用实现，适用于需要单例的服务
 *
 * @param factory - 创建实例的工厂函数
 * @param options - 单例选项
 *
 * @example
 * ```typescript
 * const fileServiceSingleton = createSingleton(
 *   async () => {
 *     const service = new UniversalFileService(config);
 *     await service.initialize();
 *     return service;
 *   },
 *   { autoInitialize: true }
 * );
 *
 * // 获取单例
 * const service = await fileServiceSingleton.get();
 *
 * // 重置（测试用）
 * fileServiceSingleton.reset();
 * ```
 */
export function createSingleton<T>(
  factory: () => Promise<T>,
  options: {
    /** 是否在第一次获取时自动初始化（默认 true） */
    autoInitialize?: boolean;
    /** 单例名称（用于日志） */
    name?: string;
  } = {}
): SingletonFactory<T> {
  const { autoInitialize = true, name = 'Singleton' } = options;
  const singletonLogger = createLogger(name);

  let instance: T | null = null;
  let initPromise: Promise<T> | null = null;

  return {
    async get(): Promise<T> {
      // 如果已经有实例，直接返回
      if (instance) {
        return instance;
      }

      // 如果正在初始化，等待初始化完成
      if (initPromise) {
        singletonLogger.debug('等待实例初始化完成...');
        return initPromise;
      }

      // 开始初始化
      singletonLogger.info('创建单例实例...');
      initPromise = factory();

      try {
        instance = await initPromise;
        singletonLogger.info('✅ 单例实例创建完成');
        return instance;
      } catch (error) {
        singletonLogger.error('❌ 单例实例创建失败:', error);
        initPromise = null; // 重置，允许重试
        throw error;
      }
    },

    reset(): void {
      if (instance) {
        singletonLogger.info('重置单例实例');
        instance = null;
        initPromise = null;
      }
    },

    isCreated(): boolean {
      return instance !== null;
    },
  };
}

