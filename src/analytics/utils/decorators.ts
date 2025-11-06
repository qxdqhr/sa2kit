/**
 * 埋点装饰器
 * Analytics Decorators
 */

import type { Analytics } from '../core/Analytics';
import { EventType, EventPriority } from '../types';

/**
 * 追踪方法执行
 * @param eventName 事件名称
 * @param priority 事件优先级
 */
export function Track(eventName?: string, priority: EventPriority = EventPriority.NORMAL) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const analytics = getAnalyticsInstance(this);
      const finalEventName = eventName || propertyKey;

      // 执行前记录
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        // 执行成功
        analytics?.track(
          EventType.CUSTOM,
          finalEventName,
          {
            success: true,
            duration: Date.now() - startTime,
            args: JSON.stringify(args),
          },
          priority
        );

        return result;
      } catch (error) {
        // 执行失败
        analytics?.track(
          EventType.ERROR,
          `${finalEventName}_error`,
          {
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          },
          EventPriority.HIGH
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 追踪点击事件
 */
export function TrackClick(eventName?: string) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      const analytics = getAnalyticsInstance(this);
      const finalEventName = eventName || propertyKey;

      analytics?.track(
        EventType.CLICK,
        finalEventName,
        {
          args: JSON.stringify(args),
        },
        EventPriority.LOW
      );

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 追踪性能
 */
export function TrackPerformance(metricName?: string) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const analytics = getAnalyticsInstance(this);
      const finalMetricName = metricName || propertyKey;
      const startTime = performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        analytics?.trackPerformance(finalMetricName, duration, 'ms', {
          success: true,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        analytics?.trackPerformance(finalMetricName, duration, 'ms', {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 自动捕获错误
 */
export function CatchError(_eventName?: string) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const analytics = getAnalyticsInstance(this);

        analytics?.trackError(
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error.stack : undefined,
          error instanceof Error ? error.name : 'Error',
          {
            method: propertyKey,
            args: JSON.stringify(args),
          }
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 从实例中获取 Analytics 实例
 */
function getAnalyticsInstance(instance: any): Analytics | null {
  // 尝试多种方式获取
  if (instance.analytics) {
    return instance.analytics;
  }
  if (instance._analytics) {
    return instance._analytics;
  }
  if ((globalThis as any).__analytics__) {
    return (globalThis as any).__analytics__;
  }
  return null;
}

/**
 * 设置全局 Analytics 实例
 */
export function setGlobalAnalytics(analytics: Analytics): void {
  (globalThis as any).__analytics__ = analytics;
}

/**
 * 获取全局 Analytics 实例
 */
export function getGlobalAnalytics(): Analytics | null {
  return (globalThis as any).__analytics__ || null;
}
