/**
 * UniversalExport Server 工具函数
 */

import type { ExportField, FieldType } from '../../types';

/**
 * 格式化字段值
 *
 * @param value 原始值
 * @param field 字段定义
 * @returns 格式化后的值
 */
export function formatFieldValue(value: any, field: ExportField): string {
  // 如果字段有自定义格式化函数，使用它
  if (field.formatter) {
    return field.formatter(value);
  }

  // 空值处理
  if (value === null || value === undefined) {
    return '';
  }

  // 根据字段类型进行默认格式化
  switch (field.type) {
    case 'date':
      return value instanceof Date
        ? (value.toISOString().split('T')[0] || '')
        : String(value);

    case 'boolean':
      return value ? '是' : '否';

    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value);

    case 'object':
      return typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

    case 'number':
      return typeof value === 'number'
        ? value.toLocaleString()
        : String(value);

    default:
      return String(value);
  }
}

/**
 * 验证字段值
 *
 * @param value 字段值
 * @param field 字段定义
 * @returns 是否有效
 */
export function validateFieldValue(value: any, field: ExportField): boolean {
  // 必填字段检查
  if (field.required && (value === null || value === undefined || value === '')) {
    return false;
  }

  // 类型检查
  switch (field.type) {
    case 'number':
      return typeof value === 'number' || !isNaN(Number(value));

    case 'boolean':
      return typeof value === 'boolean';

    case 'array':
      return Array.isArray(value);

    case 'object':
      return typeof value === 'object';

    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value));

    default:
      return true;
  }
}

/**
 * 转换字段类型
 *
 * @param value 原始值
 * @param targetType 目标类型
 * @returns 转换后的值
 */
export function convertFieldType(value: any, targetType: FieldType): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (targetType) {
    case 'string':
      return String(value);

    case 'number':
      return Number(value);

    case 'boolean':
      return Boolean(value);

    case 'date':
      return value instanceof Date ? value : new Date(value);

    case 'array':
      return Array.isArray(value) ? value : [value];

    case 'object':
      return typeof value === 'object' ? value : { value };

    default:
      return value;
  }
}

/**
 * 安全获取嵌套属性值
 *
 * @param obj 对象
 * @param path 属性路径（支持点号分隔）
 * @returns 属性值
 *
 * @example
 * ```typescript
 * const obj = { user: { name: 'John', age: 30 } };
 * getNestedValue(obj, 'user.name')  // 'John'
 * getNestedValue(obj, 'user.email') // undefined
 * ```
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 转义 CSV 字段值
 *
 * @param value 字段值
 * @returns 转义后的值
 */
export function escapeCsvValue(value: string): string {
  // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 生成唯一的文件名
 *
 * @param prefix 前缀
 * @param extension 扩展名
 * @returns 唯一文件名
 *
 * @example
 * ```typescript
 * generateUniqueFilename('export', 'xlsx')
 * // 'export_20231111_123456_abc123.xlsx'
 * ```
 */
export function generateUniqueFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * 计算导出进度百分比
 *
 * @param processed 已处理行数
 * @param total 总行数
 * @returns 百分比（0-100）
 */
export function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((processed / total) * 100), 100);
}

/**
 * 估算剩余时间（秒）
 *
 * @param processed 已处理行数
 * @param total 总行数
 * @param elapsedMs 已用时间（毫秒）
 * @returns 剩余时间（秒）
 */
export function estimateRemainingTime(
  processed: number,
  total: number,
  elapsedMs: number
): number {
  if (processed === 0) return 0;
  const avgTimePerRow = elapsedMs / processed;
  const remainingRows = total - processed;
  return Math.round((remainingRows * avgTimePerRow) / 1000);
}

