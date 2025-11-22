/**
 * Auth Routes - Analytics Adapter
 * 埋点适配器，用于适配不同的埋点服务
 */

/**
 * 埋点事件接口
 */
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventName: string;
  timestamp: string;
  priority: number;
  userId: string;
  sessionId: string;
  deviceId: string;
  platform: string;
  appVersion: string;
  sdkVersion: string;
  properties: Record<string, any>;
}

/**
 * 埋点服务接口
 */
export interface AnalyticsService {
  insertAnalyticsEvents(events: AnalyticsEvent[]): Promise<void>;
}

/**
 * 创建埋点适配器
 *
 * @param analyticsService 埋点服务实例
 * @param options 可选配置
 * @returns 符合 sa2kit 格式的埋点函数
 *
 * @example
 * ```typescript
 * import { createAnalyticsAdapter } from 'sa2kit/auth/routes';
 * import { analyticsService } from '@/lib/analytics';
 *
 * const analytics = createAnalyticsAdapter(analyticsService, {
 *   platform: 'backend',
 *   appVersion: '1.0.0',
 * });
 *
 * // 在路由配置中使用
 * const config = createDefaultLoginConfig(authService, {
 *   analytics,
 * });
 * ```
 */
export function createAnalyticsAdapter(
  analyticsService: AnalyticsService,
  options?: {
    platform?: string;
    appVersion?: string;
    sdkVersion?: string;
    deviceId?: string;
    generateId?: () => string;
  }
): {
  track: (eventName: string, properties: any) => Promise<void>;
} {
  // 默认配置
  const config = {
    platform: options?.platform || 'backend',
    appVersion: options?.appVersion || '1.0.0',
    sdkVersion: options?.sdkVersion || '1.0.0',
    deviceId: options?.deviceId || 'server',
    generateId: options?.generateId || (() => {
      // 简单的 ID 生成器（仅用于浏览器环境）
      return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }),
  };

  return {
    track: async (eventName: string, properties: any) => {
      try {
        // 推断事件类型
        let eventType = 'event';
        if (eventName.includes('login_success')) {
          eventType = 'login';
        } else if (eventName.includes('register_success')) {
          eventType = 'register';
        } else if (eventName.includes('logout')) {
          eventType = 'logout';
        } else if (eventName.includes('failed') || eventName.includes('error')) {
          eventType = 'error';
        }

        // 构建埋点事件
        const event: AnalyticsEvent = {
          id: config.generateId(),
          eventType,
          eventName,
          timestamp: new Date().toISOString(),
          priority: 1,
          userId: properties.userId || 'anonymous',
          sessionId: properties.sessionId || `session_${Date.now()}_${properties.userId || 'anonymous'}`,
          deviceId: config.deviceId,
          platform: config.platform,
          appVersion: config.appVersion,
          sdkVersion: config.sdkVersion,
          properties,
        };

        // 插入埋点事件
        await analyticsService.insertAnalyticsEvents([event]);
      } catch (error) {
        console.error('Failed to track analytics:', error);
      }
    },
  };
}

