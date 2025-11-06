/**
 * 服务端类型定义
 * Server-side Types
 */

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventName: string;
  timestamp: string;
  priority: number;
  userId?: string | null;
  sessionId: string;
  deviceId: string;
  pageUrl?: string | null;
  pageTitle?: string | null;
  referrer?: string | null;
  properties?: any;
  platform: string;
  appVersion: string;
  sdkVersion: string;
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  eventTypes?: string[];
  userId?: string;
  platform?: string;
  platforms?: string[];
  sessionId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'eventType' | 'platform';
  orderDirection?: 'asc' | 'desc';
}

export interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  uniqueDevices: number;
  eventsByType: { eventType: string; count: number }[];
  eventsByPlatform: { platform: string; count: number }[];
  topPages: { pageUrl: string; count: number }[];
}

export interface UserBehavior {
  userId: string;
  eventCount: number;
  lastActive: string;
  platforms: string[];
  topEvents: { eventType: string; count: number }[];
}

export interface SessionAnalytics {
  sessionId: string;
  userId?: string;
  deviceId: string;
  platform: string;
  startTime: string;
  endTime: string;
  duration: number;
  eventCount: number;
  events: AnalyticsEvent[];
}

export interface DatabaseInstance {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  delete: (...args: any[]) => any;
}
