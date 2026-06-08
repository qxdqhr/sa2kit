import type { FileServiceConfigManager } from '../../universalFile/server/config-manager';
import type { UniversalFileService } from '../../universalFile/server';
import { createOssFileConfigManagerFromEnv } from './config';
import {
  createOssFileServiceWithDrizzlePersistence,
  createUniversalFileServiceFromConfigManager,
  createFileUrlResolver,
  getFileUrlByFileId,
  type DrizzlePersistenceOptions,
  type FileUrlResolver,
} from './service';

export interface OssFileBootstrapOptions {
  /** 自定义配置加载（如从 DB 注入 env 后再 createOssFileConfigManagerFromEnv） */
  loadConfigManager?: () => Promise<FileServiceConfigManager>;
  /** Drizzle 持久化；传入后 createPersistentFileService 会写入 file_metadata */
  persistence?: DrizzlePersistenceOptions;
}

export interface OssFileBootstrap {
  getConfigManager(): Promise<FileServiceConfigManager>;
  /** 无 Drizzle 持久化的 UniversalFileService（如 skill-manager 自行写 metadata） */
  createFileService(): Promise<UniversalFileService>;
  createPersistentFileService(): Promise<UniversalFileService>;
  createFileUrlResolver(): FileUrlResolver;
  getFileUrl(fileId: string, userId?: string): Promise<string | null>;
}

/**
 * 一站式 OSS / universal-file 服务端 bootstrap（R2-205）。
 */
export function createOssFileBootstrap(
  options: OssFileBootstrapOptions = {},
): OssFileBootstrap {
  let configManagerPromise: Promise<FileServiceConfigManager> | null = null;

  const getConfigManager = async (): Promise<FileServiceConfigManager> => {
    configManagerPromise ??=
      options.loadConfigManager?.() ?? createOssFileConfigManagerFromEnv();
    return configManagerPromise;
  };

  return {
    getConfigManager,
    createFileService: async () => {
      const configManager = await getConfigManager();
      return createUniversalFileServiceFromConfigManager(configManager);
    },
    createPersistentFileService: async () => {
      const configManager = await getConfigManager();
      if (options.persistence) {
        return createOssFileServiceWithDrizzlePersistence({
          configManager,
          persistence: options.persistence,
        });
      }
      return createUniversalFileServiceFromConfigManager(configManager);
    },
    createFileUrlResolver: () =>
      createFileUrlResolver({ loadConfigManager: getConfigManager }),
    getFileUrl: async (fileId, userId) => {
      const configManager = await getConfigManager();
      return getFileUrlByFileId(fileId, { configManager, userId });
    },
  };
}
