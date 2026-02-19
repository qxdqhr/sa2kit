/**
 * 通用文件服务核心类型定义
 * 
 * 定义了文件存储、CDN、处理器等核心接口和类型
 */

// ============= 基础类型定义 =============

/** 文件存储类型 */
export type StorageType = 'local' | 'aliyun-oss' | 'aws-s3' | 'qcloud-cos';

/** CDN提供者类型 */
export type CDNType = 'none' | 'aliyun-cdn' | 'aws-cloudfront' | 'qcloud-cdn';

/** 文件处理类型 */
export type ProcessorType = 'image' | 'audio' | 'video' | 'document';

/** 文件上传状态 */
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';

/** 访问权限类型 */
export type AccessPermission = 'public' | 'private' | 'authenticated' | 'owner-only';

// ============= 文件元数据接口 =============

/** 文件元数据基础接口 */
export interface FileMetadata {
  /** 文件ID */
  id: string;
  /** 原始文件名 */
  originalName: string;
  /** 存储文件名 */
  storageName: string;
  /** 文件大小(字节) */
  size: number;
  /** MIME类型 */
  mimeType: string;
  /** 文件扩展名 */
  extension: string;
  /** 文件哈希值 */
  hash?: string;
  /** 上传时间 */
  uploadTime: Date;
  /** 访问权限 */
  permission: AccessPermission;
  /** 上传者ID */
  uploaderId: string;
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 存储提供者 */
  storageProvider: StorageType;
  /** 存储路径 */
  storagePath: string;
  /** CDN URL */
  cdnUrl?: string;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessTime?: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/** 上传文件信息 */
export interface UploadFileInfo {
  /** 文件对象 */
  file: File;
  /** 模块标识 */
  moduleId: string;
  /** 业务标识 */
  businessId?: string;
  /** 访问权限 */
  permission?: AccessPermission;
  /** 自定义存储路径 */
  customPath?: string;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
  /** 是否需要处理 */
  needsProcessing?: boolean;
  /** 处理选项 */
  processingOptions?: ProcessingOptions;
}

// ============= 存储提供者接口 =============

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

/** 阿里云OSS配置 */
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

// ============= CDN提供者接口 =============

/** CDN配置基础接口 */
export interface CDNConfig {
  /** CDN类型 */
  type: CDNType;
  /** 是否启用 */
  enabled: boolean;
}

/** 阿里云CDN配置 */
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

/** CDN提供者接口 */
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

// ============= 文件处理器接口 =============

/** 处理选项基础接口 */
export interface ProcessingOptions {
  /** 处理类型 */
  type: ProcessorType;
}

/** 图片处理选项 */
export interface ImageProcessingOptions extends ProcessingOptions {
  type: 'image';
  /** 压缩质量 0-100 */
  quality?: number;
  /** 目标宽度 */
  width?: number;
  /** 目标高度 */
  height?: number;
  /** 格式转换 */
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  /** 是否添加水印 */
  watermark?: boolean;
  /** 水印配置 */
  watermarkOptions?: {
    text?: string;
    image?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

/** 音频处理选项 */
export interface AudioProcessingOptions extends ProcessingOptions {
  type: 'audio';
  /** 比特率 */
  bitrate?: number;
  /** 格式转换 */
  format?: 'mp3' | 'wav' | 'ogg' | 'aac';
  /** 采样率 */
  sampleRate?: number;
  /** 声道数 */
  channels?: number;
}

/** 视频处理选项 */
export interface VideoProcessingOptions extends ProcessingOptions {
  type: 'video';
  /** 视频质量 */
  quality?: number;
  /** 格式转换 */
  format?: 'mp4' | 'avi' | 'mov' | 'webm';
  /** 生成缩略图 */
  generateThumbnail?: boolean;
  /** 缩略图时间点(秒) */
  thumbnailTime?: number;
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

/** 文件处理器接口 */
export interface IFileProcessor {
  /** 处理器类型 */
  readonly type: ProcessorType;
  
  /** 初始化 */
  initialize(): Promise<void>;
  
  /** 处理文件 */
  process(inputPath: string, outputPath: string, options: ProcessingOptions): Promise<ProcessingResult>;
  
  /** 检查文件是否支持处理 */
  supports(mimeType: string): boolean;
  
  /** 获取文件信息 */
  getFileInfo(filePath: string): Promise<Record<string, any>>;
}

// ============= 通用文件服务接口 =============

/** 文件服务配置 */
export interface UniversalFileServiceConfig {
  /** 默认存储提供者 */
  defaultStorage: StorageType;
  /** 存储提供者配置 */
  storageProviders: Record<StorageType, StorageConfig>;
  /** 默认CDN提供者 */
  defaultCDN: CDNType;
  /** CDN提供者配置 */
  cdnProviders: Record<CDNType, CDNConfig>;
  /** 文件大小限制(字节) */
  maxFileSize: number;
  /** 允许的文件类型 */
  allowedMimeTypes: string[];
  /** 是否启用文件处理 */
  enableProcessing: boolean;
  /** 处理队列大小 */
  processingQueueSize: number;
  /** 缓存配置 */
  cache: {
    /** 元数据缓存TTL(秒) */
    metadataTTL: number;
    /** URL缓存TTL(秒) */
    urlTTL: number;
  };
}

/** 上传进度信息 */
export interface UploadProgress {
  /** 文件ID */
  fileId: string;
  /** 上传状态 */
  status: UploadStatus;
  /** 上传进度 0-100 */
  progress: number;
  /** 已上传字节数 */
  uploadedBytes: number;
  /** 总字节数 */
  totalBytes: number;
  /** 上传速度(字节/秒) */
  speed: number;
  /** 剩余时间(秒) */
  remainingTime: number;
  /** 错误信息 */
  error?: string;
}

/** 批量操作结果 */
export interface BatchOperationResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 失败的文件ID和错误信息 */
  failures: Array<{
    fileId: string;
    error: string;
  }>;
}

/** 文件查询选项 */
export interface FileQueryOptions {
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 上传者ID */
  uploaderId?: string;
  /** 文件类型 */
  mimeType?: string;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: keyof FileMetadata;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/** 分页查询结果 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

// ============= 事件类型定义 =============

/** 文件事件类型 */
export type FileEventType = 
  | 'upload:start'
  | 'upload:progress' 
  | 'upload:complete'
  | 'upload:error'
  | 'processing:start'
  | 'processing:complete'
  | 'processing:error'
  | 'download:start'
  | 'download:complete'
  | 'delete:complete';

/** 文件事件数据 */
export interface FileEvent {
  /** 事件类型 */
  type: FileEventType;
  /** 文件ID */
  fileId: string;
  /** 事件时间 */
  timestamp: Date;
  /** 事件数据 */
  data?: Record<string, any>;
  /** 错误信息 */
  error?: string;
}

/** 事件监听器 */
export type FileEventListener = (event: FileEvent) => void | Promise<void>;

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