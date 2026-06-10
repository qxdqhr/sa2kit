/**
 * 埋点管理界面组件类型
 * Analytics Dashboard Component Types
 */

export interface DashboardEvent {
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
  properties?: Record<string, any>;
  platform: string;
  appVersion: string;
  sdkVersion: string;
}

export interface DashboardStats {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  uniqueDevices: number;
  eventsByType: { eventType: string; count: number }[];
  eventsByPlatform: { platform: string; count: number }[];
  topPages: { pageUrl: string; count: number }[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  eventType?: string;
  platform?: string;
  userId?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}
