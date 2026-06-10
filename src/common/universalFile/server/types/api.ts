/**
 * 通用文件服务 API 类型定义
 * 定义所有API接口的请求和响应格式
 */

// ========== 基础响应格式 ==========

/**
 * API响应的基础接口
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    /** 错误代码 */
    code: string;
    /** 错误消息 */
    message: string;
    /** 详细错误信息 */
    details?: any;
  };
  /** 元数据 */
  meta?: {
    /** 总记录数 */
    total?: number;
    /** 当前页码 */
    page?: number;
    /** 每页大小 */
    pageSize?: number;
    /** 总页数 */
    totalPages?: number;
    /** 请求ID */
    requestId?: string;
    /** 时间戳 */
    timestamp?: string;
  };
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 排序字段 */
  orderBy?: string;
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
}

/**
 * 文件上传响应
 */
export interface UploadResponse {
  /** 文件ID */
  fileId: string;
  /** 原始文件名 */
  originalName: string;
  /** 文件大小 */
  size: number;
  /** MIME类型 */
  mimeType: string;
  /** 访问URL */
  url: string;
  /** CDN URL */
  cdnUrl?: string;
  /** MD5哈希 */
  md5Hash: string;
  /** 上传时间 */
  uploadTime: string;
}

// ========== 文件管理API ==========

/**
 * 文件上传请求参数
 */
export interface FileUploadParams {
  /** 目标文件夹ID */
  folderId?: string;
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 文件标签 */
  tags?: string[];
  /** 是否为临时文件 */
  isTemporary?: boolean;
  /** 过期时间 */
  expiresAt?: string;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/**
 * 文件查询参数
 */
export interface FileQueryParams extends PaginationParams {
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 文件夹ID */
  folderId?: string;
  /** MIME类型过滤 */
  mimeType?: string;
  /** 文件名搜索 */
  search?: string;
  /** 标签过滤 */
  tags?: string[];
  /** 文件大小范围 */
  sizeMin?: number;
  sizeMax?: number;
  /** 上传时间范围 */
  uploadTimeStart?: string;
  uploadTimeEnd?: string;
  /** 是否已删除 */
  isDeleted?: boolean;
  /** 是否临时文件 */
  isTemporary?: boolean;
  /** 上传者ID */
  uploaderId?: string;
}

/**
 * 文件信息响应
 */
export interface FileInfo {
  /** 文件ID */
  id: string;
  /** 原始文件名 */
  originalName: string;
  /** 存储文件名 */
  storedName: string;
  /** 文件扩展名 */
  extension?: string;
  /** MIME类型 */
  mimeType: string;
  /** 文件大小 */
  size: number;
  /** MD5哈希 */
  md5Hash: string;
  /** SHA256哈希 */
  sha256Hash?: string;
  /** 存储路径 */
  storagePath: string;
  /** CDN访问URL */
  cdnUrl?: string;
  /** 所属文件夹ID */
  folderId?: string;
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 文件标签 */
  tags?: string[];
  /** 文件元信息 */
  metadata?: Record<string, any>;
  /** 是否为临时文件 */
  isTemporary: boolean;
  /** 是否已删除 */
  isDeleted: boolean;
  /** 访问次数 */
  accessCount: number;
  /** 下载次数 */
  downloadCount: number;
  /** 上传者ID */
  uploaderId: string;
  /** 上传时间 */
  uploadTime: string;
  /** 最后访问时间 */
  lastAccessTime?: string;
  /** 过期时间 */
  expiresAt?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 文件列表响应
 */
export interface FileListResponse {
  /** 文件列表 */
  files: FileInfo[];
  /** 分页信息 */
  pagination: {
    /** 总记录数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页大小 */
    pageSize: number;
    /** 总页数 */
    totalPages: number;
  };
}

/**
 * 文件更新参数
 */
export interface FileUpdateParams {
  /** 新的文件名 */
  originalName?: string;
  /** 文件夹ID */
  folderId?: string;
  /** 文件标签 */
  tags?: string[];
  /** 自定义元数据 */
  metadata?: Record<string, any>;
  /** 过期时间 */
  expiresAt?: string;
}

// ========== 文件夹管理API ==========

/**
 * 文件夹创建参数
 */
export interface FolderCreateParams {
  /** 文件夹名称 */
  name: string;
  /** 父文件夹ID */
  parentId?: string;
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 文件夹描述 */
  description?: string;
  /** 显示顺序 */
  sortOrder?: number;
}

/**
 * 文件夹信息响应
 */
export interface FolderInfo {
  /** 文件夹ID */
  id: string;
  /** 文件夹名称 */
  name: string;
  /** 父文件夹ID */
  parentId?: string;
  /** 模块ID */
  moduleId?: string;
  /** 业务ID */
  businessId?: string;
  /** 文件夹路径 */
  path: string;
  /** 层级深度 */
  depth: number;
  /** 显示顺序 */
  sortOrder: number;
  /** 文件夹描述 */
  description?: string;
  /** 是否为系统文件夹 */
  isSystem: boolean;
  /** 创建者ID */
  createdBy: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 子文件夹列表 */
  children?: FolderInfo[];
  /** 文件数量 */
  fileCount?: number;
}

/**
 * 文件夹更新参数
 */
export interface FolderUpdateParams {
  /** 文件夹名称 */
  name?: string;
  /** 父文件夹ID */
  parentId?: string;
  /** 文件夹描述 */
  description?: string;
  /** 显示顺序 */
  sortOrder?: number;
}

// ========== 文件处理API ==========

/**
 * 文件处理请求参数
 */
export interface FileProcessParams {
  /** 处理类型 */
  type: 'compress' | 'resize' | 'convert' | 'thumbnail' | 'watermark';
  /** 处理参数 */
  parameters: Record<string, any>;
  /** 优先级 */
  priority?: number;
}

/**
 * 文件处理状态响应
 */
export interface ProcessingStatus {
  /** 处理记录ID */
  id: string;
  /** 文件ID */
  fileId: string;
  /** 处理类型 */
  type: string;
  /** 处理状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 处理进度 */
  progress?: number;
  /** 处理参数 */
  parameters?: Record<string, any>;
  /** 处理结果 */
  result?: Record<string, any>;
  /** 输出文件路径 */
  outputPath?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 开始时间 */
  startedAt?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 创建时间 */
  createdAt: string;
}

// ========== 文件分享API ==========

/**
 * 文件分享创建参数
 */
export interface ShareCreateParams {
  /** 分享的文件ID列表 */
  fileIds: string[];
  /** 分享标题 */
  title?: string;
  /** 分享描述 */
  description?: string;
  /** 访问密码 */
  password?: string;
  /** 访问权限 */
  permission?: 'view' | 'download';
  /** 最大下载次数 */
  maxDownloads?: number;
  /** 最大访问次数 */
  maxAccess?: number;
  /** 过期时间 */
  expiresAt?: string;
}

/**
 * 文件分享信息响应
 */
export interface ShareInfo {
  /** 分享ID */
  id: string;
  /** 分享代码 */
  shareCode: string;
  /** 分享的文件ID列表 */
  fileIds: string[];
  /** 分享标题 */
  title?: string;
  /** 分享描述 */
  description?: string;
  /** 是否有密码保护 */
  hasPassword: boolean;
  /** 访问权限 */
  permission: 'view' | 'download';
  /** 最大下载次数 */
  maxDownloads?: number;
  /** 当前下载次数 */
  downloadCount: number;
  /** 最大访问次数 */
  maxAccess?: number;
  /** 当前访问次数 */
  accessCount: number;
  /** 是否启用 */
  isActive: boolean;
  /** 过期时间 */
  expiresAt?: string;
  /** 创建者ID */
  createdBy: string;
  /** 创建时间 */
  createdAt: string;
  /** 分享链接 */
  shareUrl: string;
}

/**
 * 分享访问验证参数
 */
export interface ShareAccessParams {
  /** 分享代码 */
  shareCode: string;
  /** 访问密码 */
  password?: string;
}

// ========== 统计API ==========

/**
 * 文件统计信息响应
 */
export interface FileStats {
  /** 总文件数 */
  totalFiles: number;
  /** 总文件大小 */
  totalSize: number;
  /** 按类型统计 */
  byType: Array<{
    /** MIME类型 */
    mimeType: string;
    /** 文件数量 */
    count: number;
    /** 总大小 */
    totalSize: number;
  }>;
  /** 按日期统计（最近30天） */
  byDate: Array<{
    /** 日期 */
    date: string;
    /** 上传数量 */
    count: number;
    /** 总大小 */
    totalSize: number;
  }>;
  /** 按模块统计 */
  byModule: Array<{
    /** 模块ID */
    moduleId: string;
    /** 文件数量 */
    count: number;
    /** 总大小 */
    totalSize: number;
  }>;
}

// ========== 错误代码定义 ==========

/**
 * API错误代码枚举
 */
export enum ApiErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 文件相关错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_SUPPORTED = 'FILE_TYPE_NOT_SUPPORTED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
  FILE_CORRUPTED = 'FILE_CORRUPTED',

  // 文件夹相关错误
  FOLDER_NOT_FOUND = 'FOLDER_NOT_FOUND',
  FOLDER_NOT_EMPTY = 'FOLDER_NOT_EMPTY',
  FOLDER_NAME_CONFLICT = 'FOLDER_NAME_CONFLICT',
  FOLDER_DEPTH_EXCEEDED = 'FOLDER_DEPTH_EXCEEDED',

  // 存储相关错误
  STORAGE_PROVIDER_ERROR = 'STORAGE_PROVIDER_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',

  // 分享相关错误
  SHARE_NOT_FOUND = 'SHARE_NOT_FOUND',
  SHARE_EXPIRED = 'SHARE_EXPIRED',
  SHARE_PASSWORD_INCORRECT = 'SHARE_PASSWORD_INCORRECT',
  SHARE_ACCESS_DENIED = 'SHARE_ACCESS_DENIED',
  SHARE_DOWNLOAD_LIMIT_EXCEEDED = 'SHARE_DOWNLOAD_LIMIT_EXCEEDED',
}

/**
 * 错误消息映射
 */
export const ErrorMessages: Record<ApiErrorCode, string> = {
  [ApiErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ApiErrorCode.VALIDATION_ERROR]: '参数验证失败',
  [ApiErrorCode.AUTHENTICATION_ERROR]: '身份验证失败',
  [ApiErrorCode.AUTHORIZATION_ERROR]: '权限不足',
  [ApiErrorCode.NOT_FOUND]: '资源不存在',
  [ApiErrorCode.CONFLICT]: '资源冲突',
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: '请求频率超限',

  [ApiErrorCode.FILE_NOT_FOUND]: '文件不存在',
  [ApiErrorCode.FILE_TOO_LARGE]: '文件过大',
  [ApiErrorCode.FILE_TYPE_NOT_SUPPORTED]: '不支持的文件类型',
  [ApiErrorCode.FILE_UPLOAD_FAILED]: '文件上传失败',
  [ApiErrorCode.FILE_PROCESSING_FAILED]: '文件处理失败',
  [ApiErrorCode.FILE_ALREADY_EXISTS]: '文件已存在',
  [ApiErrorCode.FILE_CORRUPTED]: '文件已损坏',

  [ApiErrorCode.FOLDER_NOT_FOUND]: '文件夹不存在',
  [ApiErrorCode.FOLDER_NOT_EMPTY]: '文件夹不为空',
  [ApiErrorCode.FOLDER_NAME_CONFLICT]: '文件夹名称冲突',
  [ApiErrorCode.FOLDER_DEPTH_EXCEEDED]: '文件夹层级过深',

  [ApiErrorCode.STORAGE_PROVIDER_ERROR]: '存储服务错误',
  [ApiErrorCode.STORAGE_QUOTA_EXCEEDED]: '存储配额已满',
  [ApiErrorCode.STORAGE_UNAVAILABLE]: '存储服务不可用',

  [ApiErrorCode.SHARE_NOT_FOUND]: '分享不存在',
  [ApiErrorCode.SHARE_EXPIRED]: '分享已过期',
  [ApiErrorCode.SHARE_PASSWORD_INCORRECT]: '分享密码错误',
  [ApiErrorCode.SHARE_ACCESS_DENIED]: '分享访问被拒绝',
  [ApiErrorCode.SHARE_DOWNLOAD_LIMIT_EXCEEDED]: '分享下载次数已达上限',
};

// ========== HTTP状态码映射 ==========

/**
 * 错误代码到HTTP状态码的映射
 */
export const ErrorHttpStatusMap: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNKNOWN_ERROR]: 500,
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.AUTHENTICATION_ERROR]: 401,
  [ApiErrorCode.AUTHORIZATION_ERROR]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ApiErrorCode.FILE_NOT_FOUND]: 404,
  [ApiErrorCode.FILE_TOO_LARGE]: 413,
  [ApiErrorCode.FILE_TYPE_NOT_SUPPORTED]: 415,
  [ApiErrorCode.FILE_UPLOAD_FAILED]: 500,
  [ApiErrorCode.FILE_PROCESSING_FAILED]: 500,
  [ApiErrorCode.FILE_ALREADY_EXISTS]: 409,
  [ApiErrorCode.FILE_CORRUPTED]: 422,

  [ApiErrorCode.FOLDER_NOT_FOUND]: 404,
  [ApiErrorCode.FOLDER_NOT_EMPTY]: 409,
  [ApiErrorCode.FOLDER_NAME_CONFLICT]: 409,
  [ApiErrorCode.FOLDER_DEPTH_EXCEEDED]: 400,

  [ApiErrorCode.STORAGE_PROVIDER_ERROR]: 502,
  [ApiErrorCode.STORAGE_QUOTA_EXCEEDED]: 507,
  [ApiErrorCode.STORAGE_UNAVAILABLE]: 503,

  [ApiErrorCode.SHARE_NOT_FOUND]: 404,
  [ApiErrorCode.SHARE_EXPIRED]: 410,
  [ApiErrorCode.SHARE_PASSWORD_INCORRECT]: 401,
  [ApiErrorCode.SHARE_ACCESS_DENIED]: 403,
  [ApiErrorCode.SHARE_DOWNLOAD_LIMIT_EXCEEDED]: 429,
};
