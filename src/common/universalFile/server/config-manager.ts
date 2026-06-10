/**
 * 通用文件服务配置管理
 */

import type {
  StorageType,
  CDNType,
  LocalStorageConfig,
  AliyunOSSConfig,
  AliyunCDNConfig,
  StorageConfig,
  CDNConfig,
} from './types';

export interface FileServiceConfig {
  defaultStorage: StorageType;
  storageProviders: Record<string, StorageConfig>;
  defaultCDN: CDNType;
  cdnProviders: Record<string, CDNConfig>;
  maxFileSize: number;
  allowedMimeTypes: string[];
  enableProcessing: boolean;
  processingQueueSize: number;
  cache: {
    metadataTTL: number;
    urlTTL: number;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: FileServiceConfig = {
  defaultStorage: 'aliyun-oss',
  storageProviders: {
    local: {
      type: 'local',
      enabled: false,
      rootPath: process.env.FILE_STORAGE_PATH || 'uploads',
      baseUrl: process.env.FILE_BASE_URL || '/uploads',
    } as LocalStorageConfig,
    'aliyun-oss': {
      type: 'aliyun-oss',
      enabled: true,
      region: '',
      bucket: '',
      accessKeyId: '',
      accessKeySecret: '',
    } as AliyunOSSConfig,
    'aws-s3': {
      type: 'aws-s3',
      enabled: false,
    } as StorageConfig,
    'qcloud-cos': {
      type: 'qcloud-cos',
      enabled: false,
    } as StorageConfig,
  },
  defaultCDN: 'none',
  cdnProviders: {
    none: {
      type: 'none',
      enabled: false,
    } as CDNConfig,
    'aliyun-cdn': {
      type: 'aliyun-cdn',
      enabled: false,
      domain: '',
      accessKeyId: '',
      accessKeySecret: '',
    } as AliyunCDNConfig,
    'aws-cloudfront': {
      type: 'aws-cloudfront',
      enabled: false,
    } as CDNConfig,
    'qcloud-cdn': {
      type: 'qcloud-cdn',
      enabled: false,
    } as CDNConfig,
  },
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/webm',
    'video/mkv',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/javascript',
    'text/css',
    'text/html',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/octet-stream',
    'model/gltf+json',
    'model/gltf-binary',
  ],
  enableProcessing: process.env.ENABLE_FILE_PROCESSING === 'true',
  processingQueueSize: parseInt(process.env.PROCESSING_QUEUE_SIZE || '10', 10),
  cache: {
    metadataTTL: parseInt(process.env.METADATA_CACHE_TTL || '3600', 10),
    urlTTL: parseInt(process.env.URL_CACHE_TTL || '1800', 10),
  },
};

/**
 * 配置管理器
 */
export class FileServiceConfigManager {
  private config: FileServiceConfig;

  constructor(customConfig?: Partial<FileServiceConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, customConfig);
    this.validateConfig();
  }

  /**
   * 获取完整配置
   */
  getConfig(): FileServiceConfig {
    return { ...this.config };
  }

  /**
   * 获取存储提供者配置
   */
  getStorageConfig(type: StorageType): StorageConfig | undefined {
    return this.config.storageProviders[type];
  }

  /**
   * 获取CDN提供者配置
   */
  getCDNConfig(type: CDNType): CDNConfig | undefined {
    return this.config.cdnProviders[type];
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<FileServiceConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.validateConfig();
  }

  /**
   * 启用存储提供者
   */
  enableStorageProvider(type: StorageType, config?: Partial<StorageConfig>): void {
    if (this.config.storageProviders[type]) {
      this.config.storageProviders[type] = {
        ...this.config.storageProviders[type],
        ...config,
        enabled: true,
      };
    }
  }

  /**
   * 禁用存储提供者
   */
  disableStorageProvider(type: StorageType): void {
    if (this.config.storageProviders[type]) {
      this.config.storageProviders[type].enabled = false;
    }
  }

  /**
   * 启用CDN提供者
   */
  enableCDNProvider(type: CDNType, config?: Partial<CDNConfig>): void {
    if (this.config.cdnProviders[type]) {
      this.config.cdnProviders[type] = {
        ...this.config.cdnProviders[type],
        ...config,
        enabled: true,
      };
      this.config.defaultCDN = type;
    }
  }

  /**
   * 禁用CDN提供者
   */
  disableCDNProvider(type: CDNType): void {
    if (this.config.cdnProviders[type]) {
      this.config.cdnProviders[type].enabled = false;
      if (this.config.defaultCDN === type) {
        this.config.defaultCDN = 'none';
      }
    }
  }

  /**
   * 从环境变量加载阿里云OSS配置
   */
  loadAliyunOSSFromEnv(): void {
    const config: Partial<AliyunOSSConfig> = {
      region: process.env.ALIYUN_OSS_REGION,
      bucket: process.env.ALIYUN_OSS_BUCKET,
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
      customDomain: process.env.ALIYUN_OSS_CUSTOM_DOMAIN,
      secure: process.env.ALIYUN_OSS_SECURE === 'true',
    };

    if (
      config.region &&
      config.bucket &&
      config.accessKeyId &&
      config.accessKeySecret
    ) {
      this.enableStorageProvider('aliyun-oss', config as StorageConfig);
      this.config.defaultStorage = 'aliyun-oss';
    }
  }

  /**
   * 从环境变量加载阿里云CDN配置
   */
  loadAliyunCDNFromEnv(): void {
    const config: Partial<AliyunCDNConfig> = {
      domain: process.env.ALIYUN_CDN_DOMAIN,
      accessKeyId: process.env.ALIYUN_CDN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_CDN_ACCESS_KEY_SECRET,
    };

    if (config.domain && config.accessKeyId && config.accessKeySecret) {
      this.enableCDNProvider('aliyun-cdn', config as CDNConfig);
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.defaultStorage) {
      throw new Error('默认存储类型未配置');
    }
    if (!this.config.storageProviders[this.config.defaultStorage]) {
      throw new Error('默认存储提供者配置不存在');
    }
  }

  /**
   * 深度合并配置
   */
  private mergeConfig(
    base: FileServiceConfig,
    override?: Partial<FileServiceConfig>,
  ): FileServiceConfig {
    if (!override) {
      return { ...base };
    }

    return {
      ...base,
      ...override,
      storageProviders: {
        ...base.storageProviders,
        ...override.storageProviders,
      },
      cdnProviders: {
        ...base.cdnProviders,
        ...override.cdnProviders,
      },
      cache: {
        ...base.cache,
        ...override.cache,
      },
      allowedMimeTypes: override.allowedMimeTypes || base.allowedMimeTypes,
    };
  }
}

/**
 * 创建配置管理器
 */
export async function createFileServiceConfigWithConfigManager(
  customConfig?: Partial<FileServiceConfig>,
): Promise<FileServiceConfigManager> {
  const configManager = new FileServiceConfigManager(customConfig);
  configManager.loadAliyunOSSFromEnv();
  configManager.loadAliyunCDNFromEnv();
  return configManager;
}
