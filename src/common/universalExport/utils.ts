/**
 * 通用导出服务工具函数
 */

import type { ExportFormat, Formatter } from './types';
import { EXPORT_FORMAT_EXTENSIONS } from './constants';

// ============= 文件名处理 =============

/**
 * 生成导出文件名
 */
export function generateExportFileName(template: string, format: ExportFormat): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0] || '';
  const timeStr = (now.toTimeString().split(' ')[0] || '').replace(/:/g, '-');
  const extension = EXPORT_FORMAT_EXTENSIONS[format];

  return (
    template
      .replace('{date}', dateStr)
      .replace('{time}', timeStr)
      .replace('{timestamp}', now.getTime().toString()) + '.' + (extension)
  );
}

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

  return true;
}

/**
 * 清理文件名，移除非法字符
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[<>:"|?*\/\\]/g, '_').substring(0, 255);
}

// ============= CSV处理 =============

/**
 * 转义CSV字段
 */
export function escapeCSVField(value: string, delimiter: string = ','): string {
  const valueStr = String(value || '');

  // 如果包含分隔符、双引号或换行符，需要用双引号包裹并转义内部的双引号
  if (valueStr.includes(delimiter) || valueStr.includes('"') || valueStr.includes('\n')) {
    return '"' + (valueStr.replace(/"/g, '""')) + '"';
  }

  return valueStr;
}

/**
 * 解析CSV字段
 */
export function parseCSVField(field: string): string {
  // 如果字段被双引号包裹，移除双引号并还原转义的双引号
  if (field.startsWith('"') && field.endsWith('"')) {
    return field.slice(1, -1).replace(/""/g, '"');
  }

  return field;
}

// ============= 数据格式化 =============

/**
 * 内置格式化器集合
 */
export const DEFAULT_FORMATTERS: Record<string, Formatter> = {
  // 日期格式化
  date: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toISOString().split('T')[0] || '';
  },

  // 时间格式化
  datetime: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString('zh-CN');
  },

  // 数字格式化
  number: (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  // 货币格式化
  currency: (value: any) => {
    if (value === null || value === undefined) return '';
    return '¥' + (Number(value).toFixed(2));
  },

  // 百分比格式化
  percentage: (value: any) => {
    if (value === null || value === undefined) return '';
    return ((Number(value) * 100).toFixed(2)) + '%';
  },

  // 布尔值格式化
  boolean: (value: any) => {
    if (value === null || value === undefined) return '';
    return value ? '是' : '否';
  },

  // 数组格式化
  array: (value: any) => {
    if (!Array.isArray(value)) return '';
    return value.join(', ');
  },

  // 对象格式化
  object: (value: any) => {
    if (!value || typeof value !== 'object') return '';
    return JSON.stringify(value);
  },
};

/**
 * 应用格式化器
 */
export function applyFormatter(value: any, formatter?: Formatter, type?: string): string {
  // 优先使用自定义格式化器
  if (formatter) {
    return formatter(value);
  }

  // 使用类型对应的默认格式化器
  if (type && DEFAULT_FORMATTERS[type]) {
    return DEFAULT_FORMATTERS[type](value);
  }

  // 默认转字符串
  return String(value || '');
}

// ============= 数据验证 =============

/**
 * 验证导出配置
 */
export function validateExportConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必填字段
  if (!config.name || config.name.trim() === '') {
    errors.push('配置名称不能为空');
  }

  if (!config.fields || !Array.isArray(config.fields) || config.fields.length === 0) {
    errors.push('至少需要定义一个字段');
  }

  if (config.fields) {
    const enabledFields = config.fields.filter((f: any) => f.enabled);
    if (enabledFields.length === 0) {
      errors.push('至少需要启用一个字段');
    }

    // 检查字段键名唯一性
    const keys = config.fields.map((f: any) => f.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      errors.push('字段键名必须唯一');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证导出请求
 */
export function validateExportRequest(request: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.configId) {
    errors.push('导出配置ID不能为空');
  }

  if (!request.dataSource) {
    errors.push('数据源不能为空');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============= 文件大小格式化 =============

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

// ============= 时间处理 =============

/**
 * 格式化持续时间
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return (milliseconds) + 'ms';
  }

  const seconds = Math.floor(milliseconds / 1000);

  if (seconds < 60) {
    return (seconds) + '秒';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? (minutes) + '分' + (remainingSeconds) + '秒' : (minutes) + '分钟';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? (hours) + '小时' + (remainingMinutes) + '分钟' : (hours) + '小时';
}

/**
 * 计算预计完成时间
 */
export function estimateEndTime(
  startTime: Date,
  processedRows: number,
  totalRows: number
): Date | undefined {
  if (processedRows === 0 || totalRows === 0) {
    return undefined;
  }

  const elapsed = Date.now() - startTime.getTime();
  const avgTimePerRow = elapsed / processedRows;
  const remainingRows = totalRows - processedRows;
  const remainingTime = avgTimePerRow * remainingRows;

  return new Date(Date.now() + remainingTime);
}

// ============= 数据处理 =============

/**
 * 获取嵌套对象的值
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * 设置嵌套对象的值
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop();

  if (!lastKey) return;

  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

// ============= 错误处理 =============

/**
 * 创建导出错误对象
 */
export function createExportError(
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

  return '未知错误';
}
