import { UniversalFileService } from './UniversalFileService';
import { createFileServiceConfigWithConfigManager } from './config-manager';

/**
 * 创建支持动态配置加载的通用文件服务
 */
export async function createUniversalFileServiceWithConfigManager(): Promise<UniversalFileService> {
  const configManager = await createFileServiceConfigWithConfigManager();
  const config = configManager.getConfig();

  const defaultStorageType = config.defaultStorage || 'local';
  const storageConfig = config.storageProviders[defaultStorageType];

  if (!storageConfig) {
    throw new Error(`未找到存储配置: ${defaultStorageType}`);
  }

  const serviceConfig = {
    storage: storageConfig,
    cdn: config.defaultCDN !== 'none' ? config.cdnProviders[config.defaultCDN] : undefined,
    maxFileSize: config.maxFileSize,
    allowedMimeTypes: config.allowedMimeTypes,
    cache: {
      enabled: true,
      metadataTTL: config.cache.metadataTTL,
      urlTTL: config.cache.urlTTL,
    },
    defaultStorage: defaultStorageType,
    defaultCDN: config.defaultCDN,
    storageProviders: config.storageProviders,
  };

  const fileService = new UniversalFileService(serviceConfig as any);
  await fileService.initialize();
  return fileService;
}
