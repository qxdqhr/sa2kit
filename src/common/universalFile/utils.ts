/**
 * 通用文件服务工具函数
 */

import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
} from './constants';

// ============= 文件大小处理 =============

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return ((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (units[i]);
}

/**
 * 解析文件大小字符串
 */
export function parseFileSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
  if (!match || !match[1] || !match[2]) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return value * (units[unit] || 1);
}

// ============= MIME类型处理 =============

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * 根据文件名获取MIME类型
 */
export function getMimeTypeFromFileName(fileName: string): string {
  const ext = getFileExtension(fileName);

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * 检查MIME类型是否支持
 */
export function isMimeTypeSupported(mimeType: string, allowedTypes?: string[]): boolean {
  if (allowedTypes && allowedTypes.length > 0) {
    return allowedTypes.includes(mimeType);
  }

  return (
    IMAGE_MIME_TYPES.includes(mimeType) ||
    VIDEO_MIME_TYPES.includes(mimeType) ||
    AUDIO_MIME_TYPES.includes(mimeType) ||
    DOCUMENT_MIME_TYPES.includes(mimeType)
  );
}

/**
 * 判断是否为图片类型
 */
export function isImageFile(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.includes(mimeType);
}

/**
 * 判断是否为视频类型
 */
export function isVideoFile(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.includes(mimeType);
}

/**
 * 判断是否为音频类型
 */
export function isAudioFile(mimeType: string): boolean {
  return AUDIO_MIME_TYPES.includes(mimeType);
}

/**
 * 判断是否为文档类型
 */
export function isDocumentFile(mimeType: string): boolean {
  return DOCUMENT_MIME_TYPES.includes(mimeType);
}

/**
 * 获取文件类型类别
 */
export function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (isImageFile(mimeType)) return 'image';
  if (isVideoFile(mimeType)) return 'video';
  if (isAudioFile(mimeType)) return 'audio';
  if (isDocumentFile(mimeType)) return 'document';
  return 'other';
}

// ============= 文件名处理 =============

/**
 * 验证文件名是否合法
 */
export function validateFileName(fileName: string): boolean {
  // 检查是否包含非法字符
  const invalidChars = /[<>:"|?*\/\\]/;
  if (invalidChars.test(fileName)) {
    return false;
  }

  // 检查长度
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }

  // 检查是否以点开头
  if (fileName.startsWith('.')) {
    return false;
  }

  return true;
}

/**
 * 清理文件名，移除非法字符
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"|?*\/\\]/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFileName(originalName: string, fileId: string): string {
  const ext = getFileExtension(originalName);
  return (fileId) + (ext);
}

// ============= 存储路径处理 =============

/**
 * 生成存储路径
 */
export function generateStoragePath(
  moduleId: string,
  fileName: string,
  options?: {
    businessId?: string;
    useDate?: boolean;
    customPrefix?: string;
  }
): string {
  const parts: string[] = [];

  // 添加自定义前缀
  if (options?.customPrefix) {
    parts.push(options.customPrefix);
  }

  // 添加模块标识
  parts.push(moduleId);

  // 添加业务标识
  if (options?.businessId) {
    parts.push(options.businessId);
  }

  // 添加日期路径
  if (options?.useDate !== false) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    parts.push(String(year), month, day);
  }

  // 添加文件名
  parts.push(fileName);

  return parts.join('/');
}

/**
 * 解析存储路径
 */
export function parseStoragePath(path: string): {
  moduleId?: string;
  businessId?: string;
  year?: string;
  month?: string;
  day?: string;
  fileName: string;
} {
  const parts = path.split('/');
  const fileName = parts[parts.length - 1] || '';

  return {
    moduleId: parts[0] || undefined,
    businessId: parts.length > 5 ? parts[1] : undefined,
    year: parts.length > 3 ? parts[parts.length - 4] : undefined,
    month: parts.length > 2 ? parts[parts.length - 3] : undefined,
    day: parts.length > 1 ? parts[parts.length - 2] : undefined,
    fileName,
  };
}

// ============= 文件验证 =============

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '文件大小超过限制: ' + (formatFileSize(file.size)) + ' > ' + (formatFileSize(maxSize)),
    };
  }

  return { valid: true };
}

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  const mimeType = file.type || getMimeTypeFromFileName(file.name);

  if (!isMimeTypeSupported(mimeType, allowedTypes)) {
    return {
      valid: false,
      error: '不支持的文件类型: ' + (mimeType),
    };
  }

  return { valid: true };
}

/**
 * 验证文件
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证文件名
  if (!validateFileName(file.name)) {
    errors.push('文件名包含非法字符或长度不合法');
  }

  // 验证文件大小
  if (options?.maxSize) {
    const sizeResult = validateFileSize(file, options.maxSize);
    if (!sizeResult.valid && sizeResult.error) {
      errors.push(sizeResult.error);
    }
  }

  // 验证文件类型
  if (options?.allowedTypes) {
    const typeResult = validateFileType(file, options.allowedTypes);
    if (!typeResult.valid && typeResult.error) {
      errors.push(typeResult.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============= URL处理 =============

/**
 * 构建查询字符串
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? '?' + (queryString) : '';
}

/**
 * 解析URL查询参数
 */
export function parseQueryString(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url, window.location.origin);

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

// ============= 进度计算 =============

/**
 * 计算上传进度
 */
export function calculateProgress(uploadedBytes: number, totalBytes: number): number {
  if (totalBytes === 0) return 0;
  return Math.min(Math.round((uploadedBytes / totalBytes) * 100), 100);
}

/**
 * 计算上传速度
 */
export function calculateSpeed(uploadedBytes: number, elapsedTime: number): number {
  if (elapsedTime === 0) return 0;
  return uploadedBytes / (elapsedTime / 1000); // 字节/秒
}

/**
 * 计算剩余时间
 */
export function calculateRemainingTime(
  uploadedBytes: number,
  totalBytes: number,
  speed: number
): number {
  if (speed === 0) return 0;
  const remainingBytes = totalBytes - uploadedBytes;
  return Math.round(remainingBytes / speed); // 秒
}

// ============= 错误处理 =============

/**
 * 创建文件错误对象
 */
export function createFileError(
  code: string,
  message: string,
  details?: Record<string, any>
): { code: string; message: string; details?: Record<string, any>; timestamp: Date } {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
  };
}

/**
 * 格式化错误消息
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return '未知错误';
}

// ============= 文件读取 =============

/**
 * 读取文件为Base64
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // 移除Data URL前缀
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 读取文件为ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 读取文件为文本
 */
export function readFileAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file, encoding);
  });
}
