/**
 * 埋点 API 路由处理器
 * Analytics API Route Handlers
 *
 * 使用方式（Next.js）：
 * import { createAnalyticsHandlers } from '@lyricnote/shared/analytics/server'
 * const handlers = createAnalyticsHandlers(analyticsService)
 * export const POST = handlers.handleEventsPost
 */

import type { AnalyticsEvent, AnalyticsQueryParams } from './types';

// 服务接口类型
interface AnalyticsService {
  insertAnalyticsEvents: (events: AnalyticsEvent[]) => Promise<void>;
  queryAnalyticsEvents: (
    params: AnalyticsQueryParams
  ) => Promise<{ events: AnalyticsEvent[]; total: number }>;
  getAnalyticsStats: (startDate?: string, endDate?: string, platform?: string) => Promise<any>;
  getUserBehavior: (userId: string, startDate?: string, endDate?: string) => Promise<any>;
  getSessionAnalytics: (sessionId: string) => Promise<any>;
  getFunnelAnalysis: (steps: string[], startDate?: string, endDate?: string) => Promise<any>;
}

// Request/Response 接口（兼容多种框架）
interface Request {
  json: () => Promise<any>;
  url?: string;
  nextUrl?: { searchParams: URLSearchParams };
}

interface ResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * 创建埋点 API 处理器
 */
export function createAnalyticsHandlers(
  service: AnalyticsService,
  ResponseClass?: any // Next.js NextResponse 或其他响应类
) {
  // 默认使用标准响应格式
  const createResponse = ResponseClass
    ? (data: any, init?: ResponseInit) => ResponseClass.json(data, init)
    : (data: any, init?: ResponseInit) => ({ body: data, status: init?.status || 200 });

  return {
    /**
     * POST /api/analytics/events
     * 处理事件上报
     */
    async handleEventsPost(request: Request) {
      try {
        const body = await request.json();
        const { events } = body;

        // 验证数据
        if (!Array.isArray(events)) {
          return createResponse(
            { success: false, message: 'Invalid events format' },
            { status: 400 }
          );
        }

        if (events.length === 0) {
          return createResponse(
            { success: true, message: 'No events to process' },
            { status: 200 }
          );
        }

        // 验证每个事件的必填字段
        for (const event of events) {
          if (!event.event_id || !event.event_type || !event.event_name) {
            return createResponse(
              { success: false, message: 'Missing required event fields' },
              { status: 400 }
            );
          }
        }

        // 转换字段名（前端使用 snake_case，数据库使用 camelCase）
        const formattedEvents = events.map((event) => ({
          id: event.event_id,
          eventType: event.event_type,
          eventName: event.event_name,
          timestamp: new Date(event.timestamp).toISOString(),
          priority: event.priority,
          userId: event.user_id || null,
          sessionId: event.session_id,
          deviceId: event.device_id,
          pageUrl: event.page_url || null,
          pageTitle: event.page_title || null,
          referrer: event.referrer || null,
          properties: event.properties || {},
          platform: event.platform,
          appVersion: event.app_version,
          sdkVersion: event.sdk_version,
        }));

        // 插入数据库
        await service.insertAnalyticsEvents(formattedEvents);

        return createResponse({
          success: true,
          message: 'Events received successfully',
          count: events.length,
        });
      } catch (error) {
        console.error('Failed to process analytics events', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },

    /**
     * GET /api/analytics/query
     * 查询埋点事件
     */
    async handleQueryGet(request: Request) {
      try {
        // 解析查询参数
        const searchParams =
          request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1]);

        const params: AnalyticsQueryParams = {
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
          eventType: searchParams.get('eventType') || undefined,
          eventTypes: searchParams.get('eventTypes')?.split(',') || undefined,
          userId: searchParams.get('userId') || undefined,
          platform: searchParams.get('platform') || undefined,
          platforms: searchParams.get('platforms')?.split(',') || undefined,
          sessionId: searchParams.get('sessionId') || undefined,
          limit: parseInt(searchParams.get('limit') || '100'),
          offset: parseInt(searchParams.get('offset') || '0'),
          orderBy: (searchParams.get('orderBy') || 'timestamp') as any,
          orderDirection: (searchParams.get('orderDirection') || 'desc') as any,
        };

        // 查询数据
        const result = await service.queryAnalyticsEvents(params);

        return createResponse({
          success: true,
          data: result.events,
          total: result.total,
          limit: params.limit,
          offset: params.offset,
        });
      } catch (error) {
        console.error('Failed to query analytics events', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },

    /**
     * GET /api/analytics/stats
     * 获取统计数据
     */
    async handleStatsGet(request: Request) {
      try {
        const searchParams =
          request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1]);

        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const platform = searchParams.get('platform') || undefined;

        // 获取统计数据
        const stats = await service.getAnalyticsStats(startDate, endDate, platform);

        return createResponse({
          success: true,
          data: stats,
        });
      } catch (error) {
        console.error('Failed to get analytics stats', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },

    /**
     * GET /api/analytics/user/[userId]
     * 获取用户行为分析
     */
    async handleUserBehaviorGet(request: Request, params: { userId: string }) {
      try {
        const { userId } = params;
        const searchParams =
          request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1]);

        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        // 获取用户行为数据
        const behavior = await service.getUserBehavior(userId, startDate, endDate);

        if (!behavior) {
          return createResponse(
            { success: false, message: 'No data found for this user' },
            { status: 404 }
          );
        }

        return createResponse({
          success: true,
          data: behavior,
        });
      } catch (error) {
        console.error('Failed to get user behavior', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },

    /**
     * GET /api/analytics/session/[sessionId]
     * 获取会话分析
     */
    async handleSessionAnalyticsGet(_request: Request, params: { sessionId: string }) {
      try {
        const { sessionId } = params;

        // 获取会话分析数据
        const session = await service.getSessionAnalytics(sessionId);

        if (!session) {
          return createResponse({ success: false, message: 'Session not found' }, { status: 404 });
        }

        return createResponse({
          success: true,
          data: session,
        });
      } catch (error) {
        console.error('Failed to get session analytics', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },

    /**
     * POST /api/analytics/funnel
     * 漏斗分析
     */
    async handleFunnelPost(request: Request) {
      try {
        const body = await request.json();
        const { steps, startDate, endDate } = body;

        // 验证数据
        if (!Array.isArray(steps) || steps.length === 0) {
          return createResponse(
            { success: false, message: 'Invalid steps format' },
            { status: 400 }
          );
        }

        // 获取漏斗分析数据
        const funnel = await service.getFunnelAnalysis(steps, startDate, endDate);

        return createResponse({
          success: true,
          data: funnel,
        });
      } catch (error) {
        console.error('Failed to get funnel analysis', error);

        return createResponse(
          {
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          },
          { status: 500 }
        );
      }
    },
  };
}
