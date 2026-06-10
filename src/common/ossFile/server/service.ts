import {
  UniversalFileService,
  createFileServiceWithFactory,
  loadConfigFromEnv,
  createDrizzleFileRepository,
} from '../../universalFile/server';
import type { FileServiceFactoryOptions } from '../../universalFile/server/config-helpers';
import type { UploadFileInfo } from '../../universalFile/types';
import {
  FileServiceConfigManager,
  type FileServiceConfig,
} from '../../universalFile/server/config-manager';
import { createUniversalFileServiceWithConfigManager } from '../../universalFile/server/service-helpers';
import { createOssFileConfigManagerFromEnv } from './config';

export { UniversalFileService, createUniversalFileServiceWithConfigManager };

export interface DrizzlePersistenceOptions {
  db: unknown;
  fileMetadata: unknown;
  fileStorageProviders: unknown;
}

export async function createOssFileServiceWithDrizzlePersistence(options: {
  configManager?: FileServiceConfigManager;
  persistence: DrizzlePersistenceOptions;
}): Promise<UniversalFileService> {
  const configManager = options.configManager
    ?? await createOssFileConfigManagerFromEnv();
  const repository = createDrizzleFileRepository({
    db: options.persistence.db,
    fileMetadata: options.persistence.fileMetadata,
    fileStorageProviders: options.persistence.fileStorageProviders,
  });
  return createUniversalFileServiceFromConfigManager(configManager, repository);
}

export async function resolveUploadAccessUrl(
  service: UniversalFileService,
  fileId: string,
  options?: { cdnUrl?: string | null; userId?: string; fallbackPath?: string },
): Promise<string> {
  if (options?.cdnUrl) {
    return options.cdnUrl;
  }
  try {
    const url = await service.getFileUrl(fileId, options?.userId);
    if (url) return url;
  } catch {
    // fall through
  }
  return options?.fallbackPath ?? `/uploads/${fileId}`;
}

export async function uploadFileAndResolveAccessUrl(
  service: UniversalFileService,
  uploadInfo: UploadFileInfo,
  userId?: string,
): Promise<{ fileId: string; accessUrl: string; uploadResult: Awaited<ReturnType<UniversalFileService['uploadFile']>> }> {
  const uploadResult = await service.uploadFile(uploadInfo);
  const accessUrl = await resolveUploadAccessUrl(service, uploadResult.id, {
    cdnUrl: uploadResult.cdnUrl,
    userId,
    fallbackPath: `/uploads/${uploadResult.storagePath}`,
  });
  return {
    fileId: uploadResult.id,
    accessUrl,
    uploadResult,
  };
}

/**
 * 基于配置管理器创建并初始化 UniversalFileService。
 */
export async function createUniversalFileServiceFromConfigManager(
  configManager: FileServiceConfigManager,
  repository?: unknown,
): Promise<UniversalFileService> {
  const config = configManager.getConfig();
  const serviceConfig = {
    storage: config.storageProviders[config.defaultStorage],
    defaultStorage: config.defaultStorage,
    defaultCDN: config.defaultCDN,
    storageProviders: config.storageProviders,
    cdnProviders: config.cdnProviders,
    maxFileSize: config.maxFileSize,
    allowedMimeTypes: config.allowedMimeTypes,
    cache: {
      enabled: true,
      metadataTTL: config.cache.metadataTTL,
      urlTTL: config.cache.urlTTL,
    },
    ...(repository
      ? {
          persistence: {
            enabled: true,
            repository,
            autoPersist: true,
          },
        }
      : {}),
  };

  const service = new UniversalFileService(serviceConfig as any);
  await service.initialize();
  return service;
}

/**
 * 通过 fileId 解析访问 URL（需已初始化的 UniversalFileService 或全局 ConfigManager）。
 */
export async function getFileUrlByFileId(
  fileId: string,
  options?: {
    configManager?: FileServiceConfigManager;
    service?: UniversalFileService;
    userId?: string;
  },
): Promise<string | null> {
  try {
    if (options?.service) {
      return await options.service.getFileUrl(fileId, options.userId);
    }
    if (options?.configManager) {
      const service = await createUniversalFileServiceFromConfigManager(
        options.configManager,
      );
      return await service.getFileUrl(fileId, options.userId);
    }
    const service = await createUniversalFileServiceWithConfigManager();
    return await service.getFileUrl(fileId, options?.userId);
  } catch {
    return null;
  }
}

/**
 * 批量解析 fileId → URL。
 */
export async function resolveFileUrlMap(
  fileIds: string[],
  options?: {
    resolver?: (fileId: string) => Promise<string | null | undefined>;
    configManager?: FileServiceConfigManager;
    userId?: string;
  },
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueIds = [...new Set(fileIds.filter(Boolean))];

  await Promise.all(
    uniqueIds.map(async (fileId) => {
      let url: string | null | undefined;
      if (options?.resolver) {
        url = await options.resolver(fileId);
      } else {
        url = await getFileUrlByFileId(fileId, {
          configManager: options?.configManager,
          userId: options?.userId,
        });
      }
      if (url) {
        map.set(fileId, url);
      }
    }),
  );

  return map;
}

export type FileUrlResolver = (
  fileId: string,
  userId?: string,
) => Promise<string | null | undefined>;

export interface CreateFileUrlResolverOptions {
  configManager?: FileServiceConfigManager;
  loadConfigManager?: () => Promise<FileServiceConfigManager>;
  userId?: string;
}

/**
 * 显式创建 fileId → URL 解析器（替代 globalThis 单例，R2-203）。
 */
export function createFileUrlResolver(
  options: CreateFileUrlResolverOptions = {},
): FileUrlResolver {
  let configManagerPromise: Promise<FileServiceConfigManager> | null = null;

  async function getConfigManager(): Promise<FileServiceConfigManager> {
    if (options.configManager) {
      return options.configManager;
    }
    if (options.loadConfigManager) {
      configManagerPromise ??= options.loadConfigManager();
      return configManagerPromise;
    }
    configManagerPromise ??= createOssFileConfigManagerFromEnv();
    return configManagerPromise;
  }

  return async (fileId: string, userId?: string) =>
    getFileUrlByFileId(fileId, {
      configManager: await getConfigManager(),
      userId: userId ?? options.userId,
    });
}

export async function createOssFileService(
  options: FileServiceFactoryOptions = {},
): Promise<UniversalFileService> {
  return createFileServiceWithFactory({
    configLoaders: [() => Promise.resolve(loadConfigFromEnv())],
    autoInitialize: true,
    ...options,
  });
}

export type { FileServiceConfig, FileServiceConfigManager };
