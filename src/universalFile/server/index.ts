/**
 * UniversalFile Server 模块入口
 */

// 导出所有服务端类型
export type * from './types';
export type {
  IFileMetadataRepository,
  FileServicePersistenceConfig,
} from './types';

// 导出接口
export type {
  IStorageProvider,
  ICDNProvider,
  IFileProcessor,
  UniversalFileServiceConfig,
  StorageConfig,
  CDNConfig,
  CacheConfig,
  LocalStorageConfig,
  AliyunOSSConfig,
  AliyunCDNConfig,
  StorageResult,
  StorageMetadata,
  CDNResult,
  CDNStats,
  ProcessingResult,
  ProcessorInfo,
  FileRecord,
  FileQueryOptions,
  PaginatedResult,
  FileEvent,
  FileEventListener,
  FileEventType,
  // ProcessingOptions 从 ../types 重新导出
  UploadFileInfo,
  ProcessingOptions,
} from './types';

// 服务类（将在后续 Phase 中迁移）
// export { UniversalFileService } from './UniversalFileService';

// 初始化辅助函数
export {
  createUniversalFileService,
  createFileServiceConfig,
  createFileServiceFromEnv,
} from './factory';

// 预设配置
export {
  createLocalDevPreset,
  createAliyunOSSPreset,
  createSmartPreset,
  createImageServicePreset,
  createVideoServicePreset,
  createDocumentServicePreset,
} from './presets';

// 配置验证
export {
  validateStorageConfig,
  validateServiceConfig,
  validateEnvironment,
  getRequiredEnvVars,
  ConfigValidationError,
} from './validation';

// Providers
export * from './providers';

// Processors
export * from './processors';

// 工具函数
export { getMimeType } from './utils/mime';

// 核心服务类
export { UniversalFileService } from './UniversalFileService';

// 缓存和监控
export { CacheManager } from './cache/CacheManager';
export { PerformanceMonitor } from './monitoring/PerformanceMonitor';
export { CdnCacheStrategy } from './cdn/CdnCacheStrategy';

// API 错误处理
export { ApiError } from './errors/ApiError';
export * from './types/api';

// ============= Persistence =============
export {
  createDrizzleRepository,
  type DrizzleRepositoryConfig,
  type DrizzleTable,
  type DrizzleDb,
  type FieldMapping,
} from './persistence/drizzle-repository';

