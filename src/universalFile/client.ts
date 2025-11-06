/**
 * 通用文件服务客户端SDK
 *
 * 提供文件上传、下载、查询等功能的客户端接口
 */

import type {
  FileMetadata,
  UploadFileInfo,
  UploadProgress,
  FileQueryOptions,
  PaginatedResult,
  BatchOperationResult,
} from './types';
import {
  API_ENDPOINTS,
  ERROR_CODES,
  DEFAULT_REQUEST_TIMEOUT,
  DEFAULT_UPLOAD_TIMEOUT,
} from './constants';
import { createFileError, formatErrorMessage, buildQueryString } from './utils';

// ============= 配置类型 =============

export interface UniversalFileClientConfig {
  /** API基础URL */
  baseUrl?: string;
  /** 请求超时时间(毫秒) */
  timeout?: number;
  /** 上传超时时间(毫秒) */
  uploadTimeout?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

// ============= 客户端类 =============

/**
 * 通用文件服务客户端
 */
export class UniversalFileClient {
  private config: Required<UniversalFileClientConfig>;

  constructor(config: UniversalFileClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || DEFAULT_REQUEST_TIMEOUT,
      uploadTimeout: config.uploadTimeout || DEFAULT_UPLOAD_TIMEOUT,
      headers: config.headers || {},
    };
  }

  // ============= 文件上传API =============

  /**
   * 上传文件
   */
  async uploadFile(
    fileInfo: UploadFileInfo,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.UPLOAD}`;
    const startTime = Date.now();

    // 创建FormData
    const formData = new FormData();
    formData.append('file', fileInfo.file);
    formData.append('moduleId', fileInfo.moduleId);

    if (fileInfo.businessId) {
      formData.append('businessId', fileInfo.businessId);
    }

    if (fileInfo.permission) {
      formData.append('permission', fileInfo.permission);
    }

    if (fileInfo.customPath) {
      formData.append('customPath', fileInfo.customPath);
    }

    if (fileInfo.metadata) {
      formData.append('metadata', JSON.stringify(fileInfo.metadata));
    }

    if (fileInfo.needsProcessing !== undefined) {
      formData.append('needsProcessing', String(fileInfo.needsProcessing));
    }

    if (fileInfo.processingOptions) {
      formData.append('processingOptions', JSON.stringify(fileInfo.processingOptions));
    }

    try {
      // 创建XMLHttpRequest以支持上传进度
      return await new Promise<FileMetadata>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const elapsedTime = Date.now() - startTime;
            const speed = event.loaded / (elapsedTime / 1000);
            const remainingBytes = event.total - event.loaded;
            const remainingTime = speed > 0 ? remainingBytes / speed : 0;

            const progress: UploadProgress = {
              fileId: '', // 暂时为空，上传完成后会有
              status: 'uploading',
              progress: Math.round((event.loaded / event.total) * 100),
              uploadedBytes: event.loaded,
              totalBytes: event.total,
              speed,
              remainingTime,
            };

            onProgress(progress);
          }
        });

        // 监听上传完成
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const fileMetadata = this.transformFileMetadataFromAPI(response.file);

              if (onProgress) {
                onProgress({
                  fileId: fileMetadata.id,
                  status: 'completed',
                  progress: 100,
                  uploadedBytes: fileInfo.file.size,
                  totalBytes: fileInfo.file.size,
                  speed: 0,
                  remainingTime: 0,
                });
              }

              resolve(fileMetadata);
            } catch (error) {
              reject(new Error('解析响应失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.statusText}`));
          }
        });

        // 监听错误
        xhr.addEventListener('error', () => {
          if (onProgress) {
            onProgress({
              fileId: '',
              status: 'failed',
              progress: 0,
              uploadedBytes: 0,
              totalBytes: fileInfo.file.size,
              speed: 0,
              remainingTime: 0,
              error: '网络错误',
            });
          }
          reject(new Error('上传失败'));
        });

        // 监听超时
        xhr.addEventListener('timeout', () => {
          if (onProgress) {
            onProgress({
              fileId: '',
              status: 'failed',
              progress: 0,
              uploadedBytes: 0,
              totalBytes: fileInfo.file.size,
              speed: 0,
              remainingTime: 0,
              error: '上传超时',
            });
          }
          reject(new Error('上传超时'));
        });

        // 配置请求
        xhr.open('POST', url);
        xhr.timeout = this.config.uploadTimeout;

        // 设置请求头
        Object.entries(this.config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        // 发送请求
        xhr.send(formData);
      });
    } catch (error) {
      throw createFileError(
        ERROR_CODES.FILE_UPLOAD_ERROR,
        `文件上传失败: ${formatErrorMessage(error)}`,
        { fileInfo, originalError: error }
      );
    }
  }

  // ============= 文件查询API =============

  /**
   * 获取文件访问URL
   */
  async getFileUrl(fileId: string, expiresIn?: number): Promise<string> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.GET_URL(fileId)}${
      expiresIn ? `?expiresIn=${expiresIn}` : ''
    }`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取文件URL失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `获取文件URL失败: ${formatErrorMessage(error)}`,
        { fileId, expiresIn, originalError: error }
      );
    }
  }

  /**
   * 获取文件元数据
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.GET_METADATA(fileId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw createFileError(ERROR_CODES.FILE_NOT_FOUND, '文件不存在', { fileId });
        }
        throw new Error(`获取文件元数据失败: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformFileMetadataFromAPI(data.file);
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `获取文件元数据失败: ${formatErrorMessage(error)}`,
        { fileId, originalError: error }
      );
    }
  }

  /**
   * 查询文件列表
   */
  async queryFiles(options: FileQueryOptions): Promise<PaginatedResult<FileMetadata>> {
    const queryString = buildQueryString({
      moduleId: options.moduleId,
      businessId: options.businessId,
      uploaderId: options.uploaderId,
      mimeType: options.mimeType,
      minSize: options.minSize,
      maxSize: options.maxSize,
      startTime: options.startTime?.toISOString(),
      endTime: options.endTime?.toISOString(),
      keyword: options.keyword,
      tags: options.tags,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      page: options.page,
      pageSize: options.pageSize,
    });

    const url = `${this.config.baseUrl}${API_ENDPOINTS.QUERY}${queryString}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`查询文件列表失败: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        items: data.items.map((item: any) => this.transformFileMetadataFromAPI(item)),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrev: data.hasPrev,
      };
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `查询文件列表失败: ${formatErrorMessage(error)}`,
        { options, originalError: error }
      );
    }
  }

  // ============= 文件删除API =============

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.DELETE(fileId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw createFileError(ERROR_CODES.FILE_NOT_FOUND, '文件不存在', { fileId });
        }
        throw new Error(`删除文件失败: ${response.statusText}`);
      }
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `删除文件失败: ${formatErrorMessage(error)}`,
        { fileId, originalError: error }
      );
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(fileIds: string[]): Promise<BatchOperationResult> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.BATCH_DELETE}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });

      if (!response.ok) {
        throw new Error(`批量删除文件失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `批量删除文件失败: ${formatErrorMessage(error)}`,
        { fileIds, originalError: error }
      );
    }
  }

  // ============= 上传进度API =============

  /**
   * 获取上传进度
   */
  async getUploadProgress(fileId: string): Promise<UploadProgress> {
    const url = `${this.config.baseUrl}${API_ENDPOINTS.GET_PROGRESS(fileId)}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取上传进度失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.progress;
    } catch (error) {
      throw createFileError(
        ERROR_CODES.NETWORK_ERROR,
        `获取上传进度失败: ${formatErrorMessage(error)}`,
        { fileId, originalError: error }
      );
    }
  }

  // ============= 私有辅助方法 =============

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    return {
      ...this.config.headers,
    };
  }

  /**
   * 带超时的fetch请求
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createFileError(ERROR_CODES.TIMEOUT_ERROR, '请求超时', {
          url,
          timeout: this.config.timeout,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 转换API返回的文件元数据
   */
  private transformFileMetadataFromAPI(apiData: any): FileMetadata {
    return {
      id: apiData.id,
      originalName: apiData.originalName,
      storageName: apiData.storageName || apiData.storedName,
      size: apiData.size,
      mimeType: apiData.mimeType,
      extension: apiData.extension,
      hash: apiData.hash || apiData.md5Hash || apiData.sha256Hash,
      uploadTime: new Date(apiData.uploadTime),
      permission: apiData.permission || 'public',
      uploaderId: apiData.uploaderId,
      moduleId: apiData.moduleId,
      businessId: apiData.businessId,
      storageProvider: apiData.storageProvider || 'local',
      storagePath: apiData.storagePath,
      cdnUrl: apiData.cdnUrl,
      accessCount: apiData.accessCount,
      lastAccessTime: apiData.lastAccessTime ? new Date(apiData.lastAccessTime) : undefined,
      expiresAt: apiData.expiresAt ? new Date(apiData.expiresAt) : undefined,
      metadata: apiData.metadata,
    };
  }
}

// ============= 单例导出 =============

/**
 * 默认客户端实例
 */
export const universalFileClient = new UniversalFileClient();

/**
 * 创建自定义客户端实例
 */
export function createFileClient(config?: UniversalFileClientConfig): UniversalFileClient {
  return new UniversalFileClient(config);
}
