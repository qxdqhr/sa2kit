/**
 * UniversalFile Server 端类型定义
 */

import type {
  StorageType as _StorageType,
  CDNType as _CDNType,
  ProcessorType as _ProcessorType,
  FileMetadata,
  UploadStatus,
  AccessPermission,
  UploadFileInfo as _UploadFileInfo,
  ProcessingOptions as _ProcessingOptions,
} from '../types';

// Re-export client types for server use
export type StorageType = _StorageType;
export type CDNType = _CDNType;
export type ProcessorType = _ProcessorType;
export type UploadFileInfo = _UploadFileInfo;
export type ProcessingOptions = _ProcessingOptions;

// ============= Provider 接口 =============

/** 存储提供者接口 */
export interface IStorageProvider {
  /** 提供者类型 */
  readonly type: StorageType;

  /** 初始化 */
  initialize(config: StorageConfig): Promise<void>;

  /** 上传文件 */
  upload(fileInfo: UploadFileInfo, path: string): Promise<StorageResult>;

  /** 下载文件 */
  download(path: string): Promise<Buffer>;

  /** 删除文件 */
  delete(path: string): Promise<StorageResult>;

  /** 获取文件信息 */
  getFileInfo(path: string): Promise<StorageResult>;

  /** 生成访问URL */
  getAccessUrl(path: string, expiresIn?: number): Promise<string>;

  /** 生成预签名上传URL */
  getUploadUrl(path: string, expiresIn?: number): Promise<string>;

  /** 检查文件是否存在 */
  exists(path: string): Promise<boolean>;

  /** 列出文件 */
  list(prefix: string, maxKeys?: number): Promise<string[]>;
}

/** CDN 提供者接口 */
export interface ICDNProvider {
  /** 提供者类型 */
  readonly type: CDNType;

  /** 初始化 */
  initialize(config: CDNConfig): Promise<void>;

  /** 生成CDN URL */
  generateUrl(originalUrl: string): Promise<string>;

  /** 刷新缓存 */
  refreshCache(urls: string[]): Promise<CDNResult>;

  /** 预热缓存 */
  preheatCache(urls: string[]): Promise<CDNResult>;

  /** 获取访问统计 */
  getAccessStats(startTime: Date, endTime: Date): Promise<CDNResult>;
}

/** 文件处理器接口 */
export interface IFileProcessor {
  /** 处理器类型 */
  readonly type: ProcessorType;

  /** 初始化 */
  initialize(): Promise<void>;

  /** 处理文件 */
  process(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult>;

  /** 检查文件是否支持处理 */
  supports(mimeType: string): boolean;

  /** 获取文件信息 */
  getFileInfo(filePath: string): Promise<Record<string, any>>;
}

// ============= 配置接口 =============

/** 存储配置基础接口 */
export interface StorageConfig {
  /** 存储类型 */
  type: StorageType;
  /** 是否启用 */
  enabled: boolean;
}

/** 本地存储配置 */
export interface LocalStorageConfig extends StorageConfig {
  type: 'local';
  /** 存储根目录 */
  rootPath: string;
  /** 基础URL */
  baseUrl: string;
}

/** 阿里云 OSS 配置 */
export interface AliyunOSSConfig extends StorageConfig {
  type: 'aliyun-oss';
  /** 地域 */
  region: string;
  /** 存储桶名称 */
  bucket: string;
  /** 访问密钥ID */
  accessKeyId: string;
  /** 访问密钥密码 */
  accessKeySecret: string;
  /** 自定义域名 */
  customDomain?: string;
  /** 是否使用HTTPS */
  secure?: boolean;
  /** 是否使用内网访问 */
  internal?: boolean;
}

/** CDN配置基础接口 */
export interface CDNConfig {
  /** CDN类型 */
  type: CDNType;
  /** 是否启用 */
  enabled: boolean;
}

/** 阿里云 CDN 配置 */
export interface AliyunCDNConfig extends CDNConfig {
  type: 'aliyun-cdn';
  /** CDN域名 */
  domain: string;
  /** 访问密钥ID */
  accessKeyId: string;
  /** 访问密钥密码 */
  accessKeySecret: string;
  /** 地域 */
  region?: string;
}

/** 缓存配置 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 最大缓存大小 */
  maxSize?: number;
  /** 缓存 TTL（秒） */
  ttl?: number;
  /** 是否使用 Redis */
  useRedis?: boolean;
  /** Redis 配置 */
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

/** 文件服务配置 */
/** 缓存配置扩展 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 元数据缓存TTL（秒） */
  metadataTTL?: number;
  /** URL缓存TTL（秒） */
  urlTTL?: number;
  /** 最大缓存条目数 */
  maxSize?: number;
}

export interface UniversalFileServiceConfig {
  /** 存储配置 */
  storage: StorageConfig;
  /** CDN 配置（可选） */
  cdn?: CDNConfig;
  /** 缓存配置（可选） */
  cache?: CacheConfig;
  /** 数据库持久化配置（可选） */
  persistence?: FileServicePersistenceConfig;
  /** 启用的处理器 */
  processors?: ProcessorType[];
  /** 数据库连接（可选） @deprecated 使用 persistence.repository 代替 */
  db?: any;
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 允许的文件类型 */
  allowedMimeTypes?: string[];
  /** 是否启用监控 */
  enableMonitoring?: boolean;

  // 运行时字段（由服务类内部管理）
  /** 存储提供者映射（内部使用） */
  storageProviders?: Map<StorageType, IStorageProvider>;
  /** 默认存储类型 */
  defaultStorage?: StorageType;
  /** 默认CDN类型 */
  defaultCDN?: CDNType;
}

// ============= 结果类型 =============

/** 存储结果 */
/** 存储操作结果 */
export interface StorageResult {
  /** 是否成功 */
  success: boolean;
  /** 存储路径 */
  path?: string;
  /** 访问URL */
  url?: string;
  /** 文件大小 */
  size?: number;
  /** 错误信息 */
  error?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/** 存储元数据 */
export interface StorageMetadata {
  /** 文件大小 */
  size: number;
  /** MIME 类型 */
  mimeType: string;
  /** 最后修改时间 */
  lastModified: Date;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/** CDN 结果 */
/** CDN操作结果 */
export interface CDNResult {
  /** 是否成功 */
  success: boolean;
  /** CDN URL */
  url?: string;
  /** 错误信息 */
  error?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/** CDN 统计信息 */
export interface CDNStats {
  /** 带宽（字节/秒） */
  bandwidth: number;
  /** 请求数 */
  requests: number;
  /** 流量（字节） */
  traffic: number;
  /** 统计时间范围 */
  timeRange: {
    start: Date;
    end: Date;
  };
}

/** 处理结果 */
export interface ProcessingResult {
  /** 是否成功 */
  success: boolean;
  /** 处理后的文件路径 */
  processedPath?: string;
  /** 处理后的文件大小 */
  processedSize?: number;
  /** 缩略图路径 */
  thumbnailPath?: string;
  /** 错误信息 */
  error?: string;
  /** 处理耗时(毫秒) */
  processingTime?: number;
  /** 额外数据 */
  data?: Record<string, any>;
}

/** 处理器信息 */
export interface ProcessorInfo {
  /** 处理器名称 */
  name: string;
  /** 处理器版本 */
  version: string;
  /** 支持的格式 */
  supportedFormats: string[];
  /** 支持的操作 */
  supportedOperations: string[];
}

// ============= 数据库相关类型 =============

/** 文件数据库记录 */
export interface FileRecord extends FileMetadata {
  /** 创建时间 */
  createdAt: Date | string;
  /** 更新时间 */
  updatedAt: Date | string;
}

/** 文件查询选项 */
export interface FileQueryOptions {
  /** 模块 ID */
  moduleId?: string;
  /** 业务 ID */
  businessId?: string;
  /** 上传者 ID */
  uploaderId?: string;
  /** 文件类型 */
  mimeType?: string;
  /** 访问权限 */
  permission?: AccessPermission;
  /** 状态 */
  status?: UploadStatus;
  /** 分页 */
  page?: number;
  pageSize?: number;
  /** 排序 */
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/** 分页结果 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

// ============= 事件类型 =============

/** 文件事件类型 */
export type FileEventType =
  | 'upload:start'
  | 'upload:progress'
  | 'upload:complete'
  | 'upload:error'
  | 'download:start'
  | 'download:complete'
  | 'download:error'
  | 'delete:complete'
  | 'delete:error'
  | 'process:start'
  | 'process:complete'
  | 'process:error';

/** 文件事件 */
export interface FileEvent {
  /** 事件类型 */
  type: FileEventType;
  /** 文件 ID */
  fileId: string;
  /** 事件数据 */
  data?: any;
  /** 时间戳 */
  timestamp: Date;
}

/** 事件监听器 */
export type FileEventListener = (event: FileEvent) => void | Promise<void>;

// ============= 数据库持久化接口 =============

/**
 * 文件元数据数据库持久化接口
 *
 * 实现此接口以提供自定义的数据库持久化支持
 *
 * @example
 * ```typescript
 * // Drizzle ORM 实现
 * class DrizzleFileRepository implements IFileMetadataRepository {
 *   async save(metadata: FileMetadata): Promise<void> {
 *     await db.insert(fileMetadata).values(metadata);
 *   }
 *   // ... 其他方法
 * }
 * ```
 */
export interface IFileMetadataRepository {
  /**
   * 保存文件元数据到数据库
   */
  save(metadata: FileMetadata): Promise<void>;

  /**
   * 从数据库获取文件元数据
   */
  get(fileId: string): Promise<FileMetadata | null>;

  /**
   * 查询文件列表
   */
  query(options: FileQueryOptions): Promise<PaginatedResult<FileMetadata>>;

  /**
   * 从数据库删除文件元数据
   */
  delete(fileId: string): Promise<void>;

  /**
   * 批量删除文件元数据
   */
  batchDelete(fileIds: string[]): Promise<void>;
}

/**
 * 数据库持久化配置
 */
export interface FileServicePersistenceConfig {
  /**
   * 是否启用持久化
   */
  enabled: boolean;

  /**
   * 持久化仓储实现
   */
  repository: IFileMetadataRepository;

  /**
   * 是否自动持久化（默认 true）
   * 如果为 true，文件上传完成后自动保存到数据库
   */
  autoPersist?: boolean;

  /**
   * 是否优先使用缓存（默认 false）
   * 如果为 true，查询时优先从缓存获取
   */
  cacheFirst?: boolean;
}

// ============= 异常类型定义 =============

/** 文件服务异常基类 */
export class FileServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FileServiceError';
  }
}

/** 文件上传异常 */
export class FileUploadError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_UPLOAD_ERROR', details);
    this.name = 'FileUploadError';
  }
}

/** 文件处理异常 */
export class FileProcessingError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_PROCESSING_ERROR', details);
    this.name = 'FileProcessingError';
  }
}

/** 存储提供者异常 */
export class StorageProviderError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'STORAGE_PROVIDER_ERROR', details);
    this.name = 'StorageProviderError';
  }
}

/** CDN提供者异常 */
export class CDNProviderError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CDN_PROVIDER_ERROR', details);
    this.name = 'CDNProviderError';
  }
}
