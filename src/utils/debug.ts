/**
 * 调试工具
 */

import { logger } from '../logger';
import { fileUtils } from './file';

export const debugUtils = {
  /**
   * 安全的 JSON 序列化
   */
  safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return `[Circular Reference or Invalid JSON: ${error}]`;
    }
  },

  /**
   * 性能计时器
   */
  createTimer(label?: string) {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      end: () => {
        const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = end - start;
        const message = `${label || 'Timer'}: ${duration.toFixed(2)}ms`;
        logger.info(message);
        return duration;
      },
    };
  },

  /**
   * 内存使用情况（仅在 Node.js 环境）
   */
  getMemoryUsage(): Record<string, string> | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: fileUtils.formatFileSize(usage.rss),
        heapTotal: fileUtils.formatFileSize(usage.heapTotal),
        heapUsed: fileUtils.formatFileSize(usage.heapUsed),
        external: fileUtils.formatFileSize(usage.external),
      };
    }
    return null;
  },
};

