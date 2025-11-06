/**
 * 通用文件服务模块统一导出
 */

// 导出所有类型
export type * from './types';

// 导出异常类
export {
  FileServiceError,
  FileUploadError,
  FileProcessingError,
  StorageProviderError,
  CDNProviderError,
} from './types';

// 导出客户端
export { UniversalFileClient, universalFileClient, createFileClient } from './client';
export type { UniversalFileClientConfig } from './client';

// 导出常量
export * from './constants';

// 导出工具函数
export * from './utils';

