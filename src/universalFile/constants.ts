/**
 * 通用文件服务常量定义
 */

// ============= 版本信息 =============

/** 模块版本 */
export const UNIVERSAL_FILE_VERSION = '1.0.0';

/** 模块名称 */
export const UNIVERSAL_FILE_NAME = '@qhr123/sa2kit/universalFile';

// ============= 文件大小限制 =============

/** 默认最大文件大小(字节) - 100MB */
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

/** 默认最大图片大小(字节) - 10MB */
export const DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 默认最大视频大小(字节) - 500MB */
export const DEFAULT_MAX_VIDEO_SIZE = 500 * 1024 * 1024;

/** 默认最大音频大小(字节) - 50MB */
export const DEFAULT_MAX_AUDIO_SIZE = 50 * 1024 * 1024;

/** 默认最大文档大小(字节) - 20MB */
export const DEFAULT_MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

// ============= MIME类型 =============

/** 图片MIME类型 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/** 视频MIME类型 */
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

/** 音频MIME类型 */
export const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];

/** 文档MIME类型 */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

/** 所有支持的MIME类型 */
export const ALL_SUPPORTED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
];

// ============= 文件扩展名 =============

/** 图片扩展名 */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

/** 视频扩展名 */
export const VIDEO_EXTENSIONS = ['.mp4', '.mpeg', '.mov', '.avi', '.webm'];

/** 音频扩展名 */
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac'];

/** 文档扩展名 */
export const DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
];

// ============= API端点 =============

/** API基础路径 */
export const API_BASE_PATH = '/api/universal-file';

/** API端点 */
export const API_ENDPOINTS = {
  /** 上传文件 */
  UPLOAD: `${API_BASE_PATH}/upload`,
  /** 获取文件URL */
  GET_URL: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/url`,
  /** 获取文件元数据 */
  GET_METADATA: (fileId: string) => `${API_BASE_PATH}/files/${fileId}`,
  /** 删除文件 */
  DELETE: (fileId: string) => `${API_BASE_PATH}/files/${fileId}`,
  /** 查询文件列表 */
  QUERY: `${API_BASE_PATH}/files`,
  /** 批量删除 */
  BATCH_DELETE: `${API_BASE_PATH}/files/batch-delete`,
  /** 获取上传进度 */
  GET_PROGRESS: (fileId: string) => `${API_BASE_PATH}/upload/${fileId}/progress`,
} as const;

// ============= 错误代码 =============

/** 错误代码 */
export const ERROR_CODES = {
  /** 文件上传错误 */
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  /** 文件大小超限 */
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  /** 文件类型不支持 */
  FILE_TYPE_NOT_SUPPORTED: 'FILE_TYPE_NOT_SUPPORTED',
  /** 文件不存在 */
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  /** 文件处理错误 */
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
  /** 存储提供者错误 */
  STORAGE_PROVIDER_ERROR: 'STORAGE_PROVIDER_ERROR',
  /** CDN提供者错误 */
  CDN_PROVIDER_ERROR: 'CDN_PROVIDER_ERROR',
  /** 网络错误 */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** 超时错误 */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** 未授权 */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** 权限不足 */
  FORBIDDEN: 'FORBIDDEN',
  /** 服务器错误 */
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// ============= 默认配置 =============

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 20;

/** 默认请求超时时间(毫秒) - 30秒 */
export const DEFAULT_REQUEST_TIMEOUT = 30000;

/** 默认上传超时时间(毫秒) - 5分钟 */
export const DEFAULT_UPLOAD_TIMEOUT = 300000;

/** 默认分片上传大小(字节) - 5MB */
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
