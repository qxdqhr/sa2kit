/**
 * 错误处理工具
 */

export const errorUtils = {
  /**
   * 创建标准化的错误对象
   */
  createError(
    code: string,
    message: string,
    details?: any
  ): Error & { code: string; details?: any } {
    const error = new Error(message) as Error & { code: string; details?: any };
    error.code = code;
    if (details) {
      error.details = details;
    }
    return error;
  },

  /**
   * 安全的错误信息提取
   */
  extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  },

  /**
   * 错误重试机制
   */
  async retry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // 指数退避延迟
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError!;
  },
};

