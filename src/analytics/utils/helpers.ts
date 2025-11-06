/**
 * 埋点工具函数
 * Analytics Helper Functions
 */

import type { AnalyticsEvent } from '../types';

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * 格式化事件数据
 */
export function formatEvent(event: AnalyticsEvent): string {
  return JSON.stringify(event, null, 2);
}

/**
 * 验证事件数据
 */
export function validateEvent(event: AnalyticsEvent): boolean {
  if (!event.event_id || !event.event_type || !event.event_name) {
    return false;
  }
  if (!event.timestamp || event.timestamp <= 0) {
    return false;
  }
  if (!event.session_id || !event.device_id) {
    return false;
  }
  return true;
}

/**
 * 批量验证事件
 */
export function validateEvents(events: AnalyticsEvent[]): {
  valid: AnalyticsEvent[];
  invalid: AnalyticsEvent[];
} {
  const valid: AnalyticsEvent[] = [];
  const invalid: AnalyticsEvent[] = [];

  events.forEach((event) => {
    if (validateEvent(event)) {
      valid.push(event);
    } else {
      invalid.push(event);
    }
  });

  return { valid, invalid };
}

/**
 * 计算事件大小（字节）
 */
export function getEventSize(event: AnalyticsEvent): number {
  return new Blob([JSON.stringify(event)]).size;
}

/**
 * 计算批量事件大小
 */
export function getBatchSize(events: AnalyticsEvent[]): number {
  return events.reduce((total, event) => total + getEventSize(event), 0);
}

/**
 * 过滤敏感信息
 */
export function sanitizeEvent(
  event: AnalyticsEvent,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'key']
): AnalyticsEvent {
  const sanitized = { ...event };

  if (sanitized.properties) {
    const cleanProperties = { ...sanitized.properties };

    sensitiveKeys.forEach((key) => {
      if (key in cleanProperties) {
        cleanProperties[key] = '***';
      }
    });

    sanitized.properties = cleanProperties;
  }

  return sanitized;
}

/**
 * 合并事件属性
 */
export function mergeEventProperties(
  baseProperties: Record<string, any>,
  ...additionalProperties: Record<string, any>[]
): Record<string, any> {
  return Object.assign({}, baseProperties, ...additionalProperties);
}

/**
 * 生成唯一ID
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 判断是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 判断是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(
  timestamp: number,
  format: 'date' | 'datetime' | 'time' = 'datetime'
): string {
  const date = new Date(timestamp);

  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'datetime':
    default:
      return date.toLocaleString();
  }
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 安全的 JSON.stringify
 */
export function safeStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return fallback;
  }
}

/**
 * 安全的 JSON.parse
 */
export function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * 获取页面停留时长
 */
export function getPageDuration(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * 获取当前页面 URL
 */
export function getCurrentPageUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return '';
}

/**
 * 获取当前页面标题
 */
export function getCurrentPageTitle(): string {
  if (typeof document !== 'undefined') {
    return document.title;
  }
  return '';
}

/**
 * 获取来源页面
 */
export function getReferrer(): string {
  if (typeof document !== 'undefined') {
    return document.referrer;
  }
  return '';
}
