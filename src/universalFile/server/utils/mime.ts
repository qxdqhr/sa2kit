/**
 * MIME 类型工具函数
 */

import * as path from 'path';

/** MIME 类型映射表 */
const MIME_TYPES: Record<string, string> = {
  // 图片
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',

  // 视频
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',

  // 音频
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',

  // 文档
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',

  // 压缩文件
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',

  // 代码文件
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.ts': 'application/typescript',

  // 其他
  '.csv': 'text/csv',
  '.md': 'text/markdown',
};

/**
 * 根据文件名获取 MIME 类型
 *
 * @param filename 文件名
 * @returns MIME 类型
 *
 * @example
 * ```typescript
 * getMimeType('photo.jpg')    // 'image/jpeg'
 * getMimeType('video.mp4')    // 'video/mp4'
 * getMimeType('unknown.xyz')  // 'application/octet-stream'
 * ```
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 根据 MIME 类型获取文件扩展名
 *
 * @param mimeType MIME 类型
 * @returns 文件扩展名（包含点号）
 *
 * @example
 * ```typescript
 * getExtensionFromMimeType('image/jpeg')  // '.jpg'
 * getExtensionFromMimeType('video/mp4')   // '.mp4'
 * ```
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
  for (const [ext, mime] of Object.entries(MIME_TYPES)) {
    if (mime === mimeType) {
      return ext;
    }
  }
  return null;
}

/**
 * 检查是否为图片类型
 *
 * @param mimeType MIME 类型
 * @returns 是否为图片
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * 检查是否为视频类型
 *
 * @param mimeType MIME 类型
 * @returns 是否为视频
 */
export function isVideoType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * 检查是否为音频类型
 *
 * @param mimeType MIME 类型
 * @returns 是否为音频
 */
export function isAudioType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

/**
 * 检查是否为文档类型
 *
 * @param mimeType MIME 类型
 * @returns 是否为文档
 */
export function isDocumentType(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'text/plain',
    'application/rtf',
  ];
  return documentTypes.some(type => mimeType.includes(type));
}

/**
 * 验证 MIME 类型是否在允许列表中
 *
 * @param mimeType MIME 类型
 * @param allowedTypes 允许的类型列表（支持通配符）
 * @returns 是否允许
 *
 * @example
 * ```typescript
 * isAllowedMimeType('image/jpeg', ['image/*'])        // true
 * isAllowedMimeType('video/mp4', ['image/*'])         // false
 * isAllowedMimeType('image/png', ['image/jpeg'])      // false
 * ```
 */
export function isAllowedMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some(allowed => {
    if (allowed === '*/*') {
      return true;
    }
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -2);
      return mimeType.startsWith(prefix + '/');
    }
    return mimeType === allowed;
  });
}

