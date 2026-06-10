/**
 * 埋点分析服务
 * Analytics Service
 *
 * 使用方式：
 * import { createAnalyticsService } from '@lyricnote/shared/analytics/server'
 * const service = createAnalyticsService(db, analyticsEvents, logger)
 */

import { eq, and, gte, lte, sql, desc, asc, count, inArray } from 'drizzle-orm';

// 导出类型
export * from './types';
import type {
  AnalyticsEvent,
  AnalyticsQueryParams,
  AnalyticsStats,
  UserBehavior,
  SessionAnalytics,
  DatabaseInstance,
} from './types';

// Logger 接口
interface Logger {
  info: (message: string, data?: any) => void;
  error: (message: string, error: Error) => void;
}

// 默认 logger（如果未提供）
const defaultLogger: Logger = {
  info: (message, data) => console.log('[Analytics] ' + (message), data || ''),
  error: (message, error) => console.error('[Analytics] ' + (message), error),
};

/**
 * 创建埋点服务实例
 * @param db - Drizzle 数据库实例
 * @param analyticsEventsTable - analytics_events 表定义
 * @param logger - 日志实例（可选）
 */
export function createAnalyticsService(
  db: DatabaseInstance,
  analyticsEventsTable: any,
  logger: Logger = defaultLogger
) {
  const analyticsEvents = analyticsEventsTable;

  return {
    /**
     * 批量插入埋点事件
     */
    async insertAnalyticsEvents(events: AnalyticsEvent[]): Promise<void> {
      try {
        if (events.length === 0) return;

        // 使用 onConflictDoNothing 来忽略重复的事件 ID
        // 这样可以避免前端重试或离线队列导致的重复插入
        await db.insert(analyticsEvents).values(events).onConflictDoNothing();

        logger.info('Analytics events inserted', { count: events.length });
      } catch (error) {
        logger.error('Failed to insert analytics events', error as Error);
        throw error;
      }
    },

    /**
     * 查询埋点事件
     */
    async queryAnalyticsEvents(
      params: AnalyticsQueryParams
    ): Promise<{ events: AnalyticsEvent[]; total: number }> {
      try {
        const conditions: any[] = [];

        // 时间范围过滤
        if (params.startDate) {
          conditions.push(gte(analyticsEvents.timestamp, params.startDate));
        }
        if (params.endDate) {
          conditions.push(lte(analyticsEvents.timestamp, params.endDate));
        }

        // 事件类型过滤
        if (params.eventType) {
          conditions.push(eq(analyticsEvents.eventType, params.eventType));
        }
        if (params.eventTypes && params.eventTypes.length > 0) {
          conditions.push(inArray(analyticsEvents.eventType, params.eventTypes));
        }

        // 用户过滤
        if (params.userId) {
          conditions.push(eq(analyticsEvents.userId, params.userId));
        }

        // 平台过滤
        if (params.platform) {
          conditions.push(eq(analyticsEvents.platform, params.platform));
        }
        if (params.platforms && params.platforms.length > 0) {
          conditions.push(inArray(analyticsEvents.platform, params.platforms));
        }

        // 会话过滤
        if (params.sessionId) {
          conditions.push(eq(analyticsEvents.sessionId, params.sessionId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // 查询总数
        const [{ total }] = await db
          .select({ total: count() })
          .from(analyticsEvents)
          .where(whereClause);

        // 排序
        const orderByColumn = params.orderBy || 'timestamp';
        const orderDirection = params.orderDirection || 'desc';
        const orderFn = orderDirection === 'asc' ? asc : desc;

        let orderByField;
        switch (orderByColumn) {
          case 'eventType':
            orderByField = analyticsEvents.eventType;
            break;
          case 'platform':
            orderByField = analyticsEvents.platform;
            break;
          default:
            orderByField = analyticsEvents.timestamp;
        }

        // 查询数据
        const events = await db
          .select()
          .from(analyticsEvents)
          .where(whereClause)
          .orderBy(orderFn(orderByField))
          .limit(params.limit || 100)
          .offset(params.offset || 0);

        // 修复时间戳格式：添加 'Z' 后缀表示 UTC 时间
        const formattedEvents = events.map((event: any) => ({
          ...event,
          timestamp: event.timestamp.endsWith('Z') ? event.timestamp : (event.timestamp) + 'Z',
          createdAt: event.createdAt.endsWith('Z') ? event.createdAt : (event.createdAt) + 'Z',
        }));

        return {
          events: formattedEvents as AnalyticsEvent[],
          total: Number(total),
        };
      } catch (error) {
        logger.error('Failed to query analytics events', error as Error);
        throw error;
      }
    },

    /**
     * 获取统计数据
     */
    async getAnalyticsStats(
      startDate?: string,
      endDate?: string,
      platform?: string
    ): Promise<AnalyticsStats> {
      try {
        const conditions: any[] = [];

        if (startDate) {
          conditions.push(gte(analyticsEvents.timestamp, startDate));
        }
        if (endDate) {
          conditions.push(lte(analyticsEvents.timestamp, endDate));
        }
        if (platform) {
          conditions.push(eq(analyticsEvents.platform, platform));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // 总事件数
        const [{ totalEvents }] = await db
          .select({ totalEvents: count() })
          .from(analyticsEvents)
          .where(whereClause);

        // 唯一用户数
        const [{ uniqueUsers }] = await db
          .select({ uniqueUsers: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})` })
          .from(analyticsEvents)
          .where(whereClause);

        // 唯一会话数
        const [{ uniqueSessions }] = await db
          .select({ uniqueSessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})` })
          .from(analyticsEvents)
          .where(whereClause);

        // 唯一设备数
        const [{ uniqueDevices }] = await db
          .select({ uniqueDevices: sql<number>`COUNT(DISTINCT ${analyticsEvents.deviceId})` })
          .from(analyticsEvents)
          .where(whereClause);

        // 按事件类型统计
        const eventsByType = await db
          .select({
            eventType: analyticsEvents.eventType,
            count: count(),
          })
          .from(analyticsEvents)
          .where(whereClause)
          .groupBy(analyticsEvents.eventType)
          .orderBy(desc(count()))
          .limit(10);

        // 按平台统计
        const eventsByPlatform = await db
          .select({
            platform: analyticsEvents.platform,
            count: count(),
          })
          .from(analyticsEvents)
          .where(whereClause)
          .groupBy(analyticsEvents.platform)
          .orderBy(desc(count()));

        // 热门页面
        const topPages = await db
          .select({
            pageUrl: analyticsEvents.pageUrl,
            count: count(),
          })
          .from(analyticsEvents)
          .where(and(whereClause, sql`${analyticsEvents.pageUrl} IS NOT NULL`))
          .groupBy(analyticsEvents.pageUrl)
          .orderBy(desc(count()))
          .limit(10);

        return {
          totalEvents: Number(totalEvents),
          uniqueUsers: Number(uniqueUsers),
          uniqueSessions: Number(uniqueSessions),
          uniqueDevices: Number(uniqueDevices),
          eventsByType: eventsByType.map((e: any) => ({
            eventType: e.eventType,
            count: Number(e.count),
          })),
          eventsByPlatform: eventsByPlatform.map((e: any) => ({
            platform: e.platform,
            count: Number(e.count),
          })),
          topPages: topPages
            .filter((p: any) => p.pageUrl)
            .map((p: any) => ({
              pageUrl: p.pageUrl!,
              count: Number(p.count),
            })),
        };
      } catch (error) {
        logger.error('Failed to get analytics stats', error as Error);
        throw error;
      }
    },

    /**
     * 获取用户行为分析
     */
    async getUserBehavior(
      userId: string,
      startDate?: string,
      endDate?: string
    ): Promise<UserBehavior | null> {
      try {
        const conditions: any[] = [eq(analyticsEvents.userId, userId)];

        if (startDate) {
          conditions.push(gte(analyticsEvents.timestamp, startDate));
        }
        if (endDate) {
          conditions.push(lte(analyticsEvents.timestamp, endDate));
        }

        const whereClause = and(...conditions);

        // 事件总数
        const [{ eventCount }] = await db
          .select({ eventCount: count() })
          .from(analyticsEvents)
          .where(whereClause);

        if (eventCount === 0) return null;

        // 最后活跃时间
        const [{ lastActive }] = await db
          .select({ lastActive: sql<string>`MAX(${analyticsEvents.timestamp})` })
          .from(analyticsEvents)
          .where(whereClause);

        // 使用的平台
        const platformsResult = await db
          .select({ platform: analyticsEvents.platform })
          .from(analyticsEvents)
          .where(whereClause)
          .groupBy(analyticsEvents.platform);

        // 热门事件
        const topEvents = await db
          .select({
            eventType: analyticsEvents.eventType,
            count: count(),
          })
          .from(analyticsEvents)
          .where(whereClause)
          .groupBy(analyticsEvents.eventType)
          .orderBy(desc(count()))
          .limit(5);

        return {
          userId,
          eventCount: Number(eventCount),
          lastActive,
          platforms: platformsResult.map((p: any) => p.platform),
          topEvents: topEvents.map((e: any) => ({
            eventType: e.eventType,
            count: Number(e.count),
          })),
        };
      } catch (error) {
        logger.error('Failed to get user behavior', error as Error);
        throw error;
      }
    },

    /**
     * 获取会话分析
     */
    async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
      try {
        const events = await db
          .select()
          .from(analyticsEvents)
          .where(eq(analyticsEvents.sessionId, sessionId))
          .orderBy(asc(analyticsEvents.timestamp));

        if (events.length === 0) return null;

        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];

        const startTime = new Date(firstEvent.timestamp).getTime();
        const endTime = new Date(lastEvent.timestamp).getTime();
        const duration = endTime - startTime;

        return {
          sessionId,
          userId: firstEvent.userId || undefined,
          deviceId: firstEvent.deviceId,
          platform: firstEvent.platform,
          startTime: firstEvent.timestamp,
          endTime: lastEvent.timestamp,
          duration,
          eventCount: events.length,
          events: events as AnalyticsEvent[],
        };
      } catch (error) {
        logger.error('Failed to get session analytics', error as Error);
        throw error;
      }
    },

    /**
     * 获取漏斗分析
     */
    async getFunnelAnalysis(
      steps: string[],
      startDate?: string,
      endDate?: string
    ): Promise<{ step: string; count: number; conversionRate: number }[]> {
      try {
        const results = [];
        let previousCount = 0;

        for (let i = 0; i < steps.length; i++) {
          const conditions: any[] = [eq(analyticsEvents.eventType, steps[i])];

          if (startDate) {
            conditions.push(gte(analyticsEvents.timestamp, startDate));
          }
          if (endDate) {
            conditions.push(lte(analyticsEvents.timestamp, endDate));
          }

          const whereClause = and(...conditions);

          const [{ count: stepCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})` })
            .from(analyticsEvents)
            .where(whereClause);

          const conversionRate = i === 0 ? 100 : (Number(stepCount) / previousCount) * 100;

          results.push({
            step: steps[i] || 'unknown',
            count: Number(stepCount),
            conversionRate: Math.round(conversionRate * 100) / 100,
          });

          previousCount = Number(stepCount);
        }

        return results;
      } catch (error) {
        logger.error('Failed to get funnel analysis', error as Error);
        throw error;
      }
    },

    /**
     * 删除旧数据（数据清理）
     */
    async cleanOldAnalyticsEvents(daysToKeep: number = 90): Promise<number> {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        await db
          .delete(analyticsEvents)
          .where(lte(analyticsEvents.timestamp, cutoffDate.toISOString()));

        logger.info('Old analytics events cleaned', { daysToKeep });

        return 0; // Drizzle doesn't return affected rows count in delete
      } catch (error) {
        logger.error('Failed to clean old analytics events', error as Error);
        throw error;
      }
    },
  };
}
