import type { AliyunOSSConfig } from '../../universalFile/server/types';
import type { FileServiceConfig } from '../../universalFile/server/config-manager';
import {
  FileServiceConfigManager,
  createFileServiceConfigWithConfigManager,
} from '../../universalFile/server/config-manager';
import { loadOSSConfigFromEnv } from '../../universalFile/server/config-helpers';
import {
  parseAliyunOssConfigFromMap,
  isCompleteOssConfig,
  STANDARD_ALIYUN_OSS_KEYS,
  type OssConfigKeyMap,
} from '../shared/ossConfig';

export {
  STANDARD_ALIYUN_OSS_KEYS,
  parseAliyunOssConfigFromMap,
  type OssConfigKeyMap,
};

export interface CreateOssFileConfigManagerOptions {
  ossConfig?: AliyunOSSConfig | null;
  fallbackToLocal?: boolean;
  customConfig?: Partial<FileServiceConfig>;
}

export function createOssFileConfigManager(
  options: CreateOssFileConfigManagerOptions = {},
): FileServiceConfigManager {
  const { ossConfig, fallbackToLocal = true, customConfig } = options;
  const manager = new FileServiceConfigManager(customConfig);

  const resolvedOss = ossConfig ?? loadOSSConfigFromEnv();
  if (isCompleteOssConfig(resolvedOss)) {
    manager.enableStorageProvider('aliyun-oss', resolvedOss);
    manager.updateConfig({ defaultStorage: 'aliyun-oss' });
    return manager;
  }

  if (fallbackToLocal) {
    manager.enableStorageProvider('local');
    manager.updateConfig({ defaultStorage: 'local' });
  }

  return manager;
}

export async function createOssFileConfigManagerFromEnv(
  customConfig?: Partial<FileServiceConfig>,
): Promise<FileServiceConfigManager> {
  return createFileServiceConfigWithConfigManager(customConfig);
}

export function getOssStorageModeLabel(config: FileServiceConfig): string {
  const oss = config.storageProviders['aliyun-oss'] as AliyunOSSConfig | undefined;
  if (oss?.enabled) {
    return oss.customDomain
      ? '阿里云 OSS + 自定义域名'
      : '阿里云 OSS';
  }
  return '本地存储';
}

export function isOssEnabledInConfig(config: FileServiceConfig): boolean {
  const oss = config.storageProviders['aliyun-oss'];
  return Boolean(oss?.enabled);
}

/** @deprecated 使用 createOssFileConfigManagerFromEnv */
export async function getShowMasterpieceFileConfig(): Promise<FileServiceConfigManager> {
  return createOssFileConfigManagerFromEnv();
}
