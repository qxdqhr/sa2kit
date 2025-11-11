/**
 * API错误处理工具类
 * 提供标准化的错误处理和响应格式
 */

import { NextResponse } from 'next/server';
import { ApiResponse, ApiErrorCode, ErrorMessages, ErrorHttpStatusMap } from '../types/api';

/**
 * API错误类
 * 继承自Error，添加错误代码和详细信息
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ApiErrorCode, message?: string, details?: any, statusCode?: number) {
    super(message || ErrorMessages[code]);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode || ErrorHttpStatusMap[code] || 500;
    this.details = details;

    // 确保错误堆栈正确显示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 转换为API响应格式
   */
  toApiResponse(): ApiResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 转换为NextResponse
   */
  toNextResponse(): NextResponse {
    return NextResponse.json(this.toApiResponse(), {
      status: this.statusCode,
    });
  }
}

/**
 * API错误工厂类
 * 提供便捷的错误创建方法
 */
export class ApiErrorFactory {
  /**
   * 创建文件不存在错误
   */
  static fileNotFound(fileId?: string): ApiError {
    return new ApiError(ApiErrorCode.FILE_NOT_FOUND, undefined, { fileId });
  }

  /**
   * 创建文件过大错误
   */
  static fileTooLarge(maxSize: number, actualSize: number): ApiError {
    return new ApiError(
      ApiErrorCode.FILE_TOO_LARGE,
      `文件大小 ${actualSize} 字节超过限制 ${maxSize} 字节`,
      { maxSize, actualSize }
    );
  }

  /**
   * 创建不支持的文件类型错误
   */
  static fileTypeNotSupported(mimeType: string, supportedTypes?: string[]): ApiError {
    return new ApiError(ApiErrorCode.FILE_TYPE_NOT_SUPPORTED, `不支持的文件类型: ${mimeType}`, {
      mimeType,
      supportedTypes,
    });
  }

  /**
   * 创建文件上传失败错误
   */
  static fileUploadFailed(reason?: string): ApiError {
    return new ApiError(
      ApiErrorCode.FILE_UPLOAD_FAILED,
      reason ? `文件上传失败: ${reason}` : undefined,
      { reason }
    );
  }

  /**
   * 创建文件夹不存在错误
   */
  static folderNotFound(folderId?: string): ApiError {
    return new ApiError(ApiErrorCode.FOLDER_NOT_FOUND, undefined, { folderId });
  }

  /**
   * 创建文件夹不为空错误
   */
  static folderNotEmpty(folderId: string, fileCount: number, subfolderCount: number): ApiError {
    return new ApiError(
      ApiErrorCode.FOLDER_NOT_EMPTY,
      `文件夹包含 ${fileCount} 个文件和 ${subfolderCount} 个子文件夹`,
      { folderId, fileCount, subfolderCount }
    );
  }

  /**
   * 创建参数验证错误
   */
  static validationError(field: string, value: any, rule: string): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, `字段 ${field} 验证失败: ${rule}`, {
      field,
      value,
      rule,
    });
  }

  /**
   * 创建身份验证错误
   */
  static authenticationError(reason?: string): ApiError {
    return new ApiError(
      ApiErrorCode.AUTHENTICATION_ERROR,
      reason ? `身份验证失败: ${reason}` : undefined,
      { reason }
    );
  }

  /**
   * 创建权限不足错误
   */
  static authorizationError(resource?: string, action?: string): ApiError {
    return new ApiError(
      ApiErrorCode.AUTHORIZATION_ERROR,
      resource && action ? `无权限对 ${resource} 执行 ${action} 操作` : undefined,
      { resource, action }
    );
  }

  /**
   * 创建资源冲突错误
   */
  static conflict(resource: string, reason?: string): ApiError {
    return new ApiError(
      ApiErrorCode.CONFLICT,
      reason ? `${resource} 冲突: ${reason}` : `${resource} 已存在`,
      { resource, reason }
    );
  }

  /**
   * 创建请求频率超限错误
   */
  static rateLimitExceeded(limit: number, windowMs: number): ApiError {
    return new ApiError(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      `请求频率超限，${windowMs}ms 内最多允许 ${limit} 次请求`,
      { limit, windowMs }
    );
  }

  /**
   * 创建存储服务错误
   */
  static storageProviderError(provider: string, reason?: string): ApiError {
    return new ApiError(
      ApiErrorCode.STORAGE_PROVIDER_ERROR,
      reason ? `存储服务 ${provider} 错误: ${reason}` : `存储服务 ${provider} 不可用`,
      { provider, reason }
    );
  }

  /**
   * 创建存储配额已满错误
   */
  static storageQuotaExceeded(used: number, limit: number): ApiError {
    return new ApiError(
      ApiErrorCode.STORAGE_QUOTA_EXCEEDED,
      `存储空间已满，已使用 ${used} 字节，限制 ${limit} 字节`,
      { used, limit, remaining: Math.max(0, limit - used) }
    );
  }

  /**
   * 创建分享不存在错误
   */
  static shareNotFound(shareCode?: string): ApiError {
    return new ApiError(ApiErrorCode.SHARE_NOT_FOUND, undefined, { shareCode });
  }

  /**
   * 创建分享已过期错误
   */
  static shareExpired(shareCode: string, expiredAt: string): ApiError {
    return new ApiError(ApiErrorCode.SHARE_EXPIRED, `分享已于 ${expiredAt} 过期`, {
      shareCode,
      expiredAt,
    });
  }

  /**
   * 创建分享密码错误
   */
  static sharePasswordIncorrect(shareCode: string): ApiError {
    return new ApiError(ApiErrorCode.SHARE_PASSWORD_INCORRECT, undefined, { shareCode });
  }

  /**
   * 创建分享下载次数超限错误
   */
  static shareDownloadLimitExceeded(shareCode: string, maxDownloads: number): ApiError {
    return new ApiError(
      ApiErrorCode.SHARE_DOWNLOAD_LIMIT_EXCEEDED,
      `分享下载次数已达上限 ${maxDownloads} 次`,
      { shareCode, maxDownloads }
    );
  }
}

/**
 * API响应工具类
 * 提供标准化的成功响应格式
 */
export class ApiResponseHelper {
  /**
   * 创建成功响应
   */
  static success<T>(
    data?: T,
    meta?: {
      total?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
      requestId?: string;
    }
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 创建分页响应
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
    requestId?: string
  ): ApiResponse<{ items: T[]; pagination: any }> {
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        items: data,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 创建空响应
   */
  static empty(requestId?: string): ApiResponse<null> {
    return {
      success: true,
      data: null,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 转换为NextResponse
   */
  static toNextResponse<T>(response: ApiResponse<T>, status: number = 200): NextResponse {
    return NextResponse.json(response, { status });
  }
}

/**
 * 错误处理中间件装饰器
 */
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // 如果已经是ApiError，直接抛出
      if (error instanceof ApiError) {
        throw error;
      }

      // 处理常见的系统错误
      if (error instanceof Error) {
        // 数据库连接错误
        if (error.message.includes('connect') || error.message.includes('connection')) {
          throw new ApiError(ApiErrorCode.STORAGE_UNAVAILABLE, '数据库连接失败', {
            originalError: error.message,
          });
        }

        // 文件系统错误
        if (error.message.includes('ENOENT')) {
          throw new ApiError(ApiErrorCode.FILE_NOT_FOUND, '文件不存在', {
            originalError: error.message,
          });
        }

        if (error.message.includes('EACCES') || error.message.includes('permission')) {
          throw new ApiError(ApiErrorCode.AUTHORIZATION_ERROR, '文件权限不足', {
            originalError: error.message,
          });
        }

        if (error.message.includes('ENOSPC')) {
          throw new ApiError(ApiErrorCode.STORAGE_QUOTA_EXCEEDED, '磁盘空间不足', {
            originalError: error.message,
          });
        }
      }

      // 其他未知错误
      throw new ApiError(ApiErrorCode.UNKNOWN_ERROR, '服务器内部错误', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

/**
 * 异步错误处理包装器
 */
export function handleAsyncError(
  handler: (req: Request, ...args: any[]) => Promise<NextResponse>
): (req: Request, ...args: any[]) => Promise<NextResponse> {
  return async (req: Request, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return error.toNextResponse();
      }

      // 未知错误
      const apiError = new ApiError(ApiErrorCode.UNKNOWN_ERROR, '服务器内部错误', {
        originalError: error instanceof Error ? error.message : String(error),
      });

      return apiError.toNextResponse();
    }
  };
}

/**
 * 参数验证工具
 */
export class ValidationHelper {
  /**
   * 验证必填参数
   */
  static required(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw ApiErrorFactory.validationError(fieldName, value, '不能为空');
    }
  }

  /**
   * 验证字符串长度
   */
  static stringLength(value: string, fieldName: string, min?: number, max?: number): void {
    if (min !== undefined && value.length < min) {
      throw ApiErrorFactory.validationError(fieldName, value, `长度不能少于${min}个字符`);
    }
    if (max !== undefined && value.length > max) {
      throw ApiErrorFactory.validationError(fieldName, value, `长度不能超过${max}个字符`);
    }
  }

  /**
   * 验证数字范围
   */
  static numberRange(value: number, fieldName: string, min?: number, max?: number): void {
    if (min !== undefined && value < min) {
      throw ApiErrorFactory.validationError(fieldName, value, `不能小于${min}`);
    }
    if (max !== undefined && value > max) {
      throw ApiErrorFactory.validationError(fieldName, value, `不能大于${max}`);
    }
  }

  /**
   * 验证数组长度
   */
  static arrayLength(value: any[], fieldName: string, min?: number, max?: number): void {
    if (min !== undefined && value.length < min) {
      throw ApiErrorFactory.validationError(fieldName, value, `数组长度不能少于${min}`);
    }
    if (max !== undefined && value.length > max) {
      throw ApiErrorFactory.validationError(fieldName, value, `数组长度不能超过${max}`);
    }
  }

  /**
   * 验证文件类型
   */
  static fileType(mimeType: string, allowedTypes: string[]): void {
    if (!allowedTypes.includes(mimeType)) {
      throw ApiErrorFactory.fileTypeNotSupported(mimeType, allowedTypes);
    }
  }

  /**
   * 验证文件大小
   */
  static fileSize(size: number, maxSize: number): void {
    if (size > maxSize) {
      throw ApiErrorFactory.fileTooLarge(maxSize, size);
    }
  }

  /**
   * 验证UUID格式
   */
  static uuid(value: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw ApiErrorFactory.validationError(fieldName, value, '必须是有效的UUID格式');
    }
  }

  /**
   * 验证邮箱格式
   */
  static email(value: string, fieldName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw ApiErrorFactory.validationError(fieldName, value, '必须是有效的邮箱格式');
    }
  }

  /**
   * 验证URL格式
   */
  static url(value: string, fieldName: string): void {
    try {
      new URL(value);
    } catch {
      throw ApiErrorFactory.validationError(fieldName, value, '必须是有效的URL格式');
    }
  }
}
