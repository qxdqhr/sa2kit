/**
 * 通用导出服务常量定义
 */

import type { ExportFormat } from './types';

// ============= 版本信息 =============

/** 模块版本 */
export const UNIVERSAL_EXPORT_VERSION = '1.0.0';

/** 模块名称 */
export const UNIVERSAL_EXPORT_NAME = '@lyricnote/universal-export';

// ============= 默认配置 =============

/** 默认导出格式 */
export const DEFAULT_EXPORT_FORMAT: ExportFormat = 'csv';

/** 默认CSV分隔符 */
export const DEFAULT_CSV_DELIMITER = ',';

/** 默认编码格式 */
export const DEFAULT_ENCODING = 'utf-8';

/** 默认是否添加BOM */
export const DEFAULT_ADD_BOM = true;

/** 默认最大文件大小(字节) - 100MB */
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

/** 默认最大行数限制 */
export const DEFAULT_MAX_ROWS = 100000;

/** 默认并发导出数量 */
export const DEFAULT_MAX_CONCURRENT_EXPORTS = 5;

/** 默认导出超时时间(毫秒) - 5分钟 */
export const DEFAULT_EXPORT_TIMEOUT = 300000;

/** 默认配置缓存TTL(秒) - 1小时 */
export const DEFAULT_CONFIG_CACHE_TTL = 3600;

/** 默认结果缓存TTL(秒) - 30分钟 */
export const DEFAULT_RESULT_CACHE_TTL = 1800;

// ============= 文件扩展名 =============

/** 导出格式对应的文件扩展名 */
export const EXPORT_FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: 'csv',
  excel: 'xlsx',
  json: 'json',
};

/** 导出格式对应的MIME类型 */
export const EXPORT_FORMAT_MIME_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json; charset=utf-8',
};

// ============= API端点 =============

/** API基础路径 */
export const API_BASE_PATH = '/api/universal-export';

/** API端点 */
export const API_ENDPOINTS = {
  /** 获取配置列表 */
  GET_CONFIGS: `${API_BASE_PATH}/configs`,
  /** 创建配置 */
  CREATE_CONFIG: `${API_BASE_PATH}/configs`,
  /** 更新配置 */
  UPDATE_CONFIG: (configId: string) => `${API_BASE_PATH}/configs/${configId}`,
  /** 删除配置 */
  DELETE_CONFIG: (configId: string) => `${API_BASE_PATH}/configs/${configId}`,
  /** 触发导出 */
  EXPORT_DATA: `${API_BASE_PATH}/export`,
  /** 查询导出进度 */
  GET_PROGRESS: (exportId: string) => `${API_BASE_PATH}/export/${exportId}/progress`,
  /** 下载导出文件 */
  DOWNLOAD_FILE: (exportId: string) => `${API_BASE_PATH}/export/${exportId}/download`,
} as const;

// ============= 错误代码 =============

/** 错误代码 */
export const ERROR_CODES = {
  /** 导出配置错误 */
  EXPORT_CONFIG_ERROR: 'EXPORT_CONFIG_ERROR',
  /** 导出数据错误 */
  EXPORT_DATA_ERROR: 'EXPORT_DATA_ERROR',
  /** 导出文件错误 */
  EXPORT_FILE_ERROR: 'EXPORT_FILE_ERROR',
  /** 网络错误 */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** 超时错误 */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** 未授权 */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** 服务器错误 */
  SERVER_ERROR: 'SERVER_ERROR',
} as const;
