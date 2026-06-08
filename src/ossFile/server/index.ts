export {
  STANDARD_ALIYUN_OSS_KEYS,
  parseAliyunOssConfigFromMap,
  createOssFileConfigManager,
  createOssFileConfigManagerFromEnv,
  getOssStorageModeLabel,
  isOssEnabledInConfig,
  type CreateOssFileConfigManagerOptions,
  type OssConfigKeyMap,
} from './config';

export { buildModuleUploadPath, type BuildModuleUploadPathOptions } from './path';

export {
  createOssFileBootstrap,
  type OssFileBootstrap,
  type OssFileBootstrapOptions,
} from './bootstrap';

export {
  UniversalFileService,
  createUniversalFileServiceWithConfigManager,
  createUniversalFileServiceFromConfigManager,
  createOssFileService,
  createOssFileServiceWithDrizzlePersistence,
  uploadFileAndResolveAccessUrl,
  resolveUploadAccessUrl,
  getFileUrlByFileId,
  resolveFileUrlMap,
  createFileUrlResolver,
  type FileUrlResolver,
  type CreateFileUrlResolverOptions,
  type DrizzlePersistenceOptions,
} from './service';

export type { FileServiceConfig, FileServiceConfigManager } from './service';

export {
  AliyunOSSProvider,
  createDrizzleFileRepository,
  createFileServiceWithFactory,
  loadOSSConfigFromEnv,
  loadConfigFromEnv,
  FileDbService,
  CacheManager,
  cacheManager,
  PerformanceMonitor,
  performanceMonitor,
  QueryOptimizer,
  queryOptimizer,
  ApiResponseHelper,
  ApiErrorFactory,
  ValidationHelper,
} from '../../universalFile/server';

export * from '../../universalFile/server/drizzle-schemas';

export type {
  AliyunOSSConfig,
  UploadFileInfo,
  FileQueryParams,
  FileUploadParams,
  FolderCreateParams,
  FolderUpdateParams,
  ApiResponse,
} from '../../universalFile/server';
