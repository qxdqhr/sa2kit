/**
 * 通用文件服务类型定义
 *
 * 定义了文件存储、上传、下载等核心接口和类型
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

/** 上传文件信息（客户端使用） */
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

/** 文件处理选项 */
export interface ProcessingOptions {
  /** 处理器类型 */
  type: ProcessorType;
  /** 处理参数 */
  params?: Record<string, any>;
}

// ============= 上传相关接口 =============

/** 上传进度 */
export interface UploadProgress {
  /** 文件ID */
  fileId: string;
  /** 上传状态 */
  status: UploadStatus;
  /** 进度百分比(0-100) */
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

/** 上传结果 */
export interface UploadResult {
  /** 是否成功 */
  success: boolean;
  /** 文件元数据 */
  file?: FileMetadata;
  /** 文件访问URL */
  url?: string;
  /** 错误信息 */
  error?: string;
}

// ============= 查询相关接口 =============

/** 文件查询选项 */
export interface FileQueryOptions {
  /** 模块标识 */
  moduleId?: string;
  /** 业务标识 */
  businessId?: string;
  /** 上传者ID */
  uploaderId?: string;
  /** MIME类型过滤 */
  mimeType?: string;
  /** 最小文件大小 */
  minSize?: number;
  /** 最大文件大小 */
  maxSize?: number;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 搜索关键词 */
  keyword?: string;
  /** 标签 */
  tags?: string[];
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  /** 数据项 */
  items: T[];
  /** 总数 */
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

/** 批量操作结果 */
export interface BatchOperationResult {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 失败详情 */
  failures: Array<{
    fileId: string;
    error: string;
  }>;
}

// ============= 事件相关接口 =============

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
  | 'processing:start'
  | 'processing:complete'
  | 'processing:error';

/** 文件事件 */
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

/** 文件事件监听器 */
export type FileEventListener = (event: FileEvent) => void | Promise<void>;

// ============= 异常类定义 =============

/** 文件服务基础异常 */
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

/** 文件上传错误 */
export class FileUploadError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_UPLOAD_ERROR', details);
    this.name = 'FileUploadError';
  }
}

/** 文件处理错误 */
export class FileProcessingError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_PROCESSING_ERROR', details);
    this.name = 'FileProcessingError';
  }
}

/** 存储提供者错误 */
export class StorageProviderError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'STORAGE_PROVIDER_ERROR', details);
    this.name = 'StorageProviderError';
  }
}

/** CDN提供者错误 */
export class CDNProviderError extends FileServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CDN_PROVIDER_ERROR', details);
    this.name = 'CDNProviderError';
  }
}

