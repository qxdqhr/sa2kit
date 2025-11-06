/**
 * Analytics 埋点分析模块
 *
 * 提供完整的事件追踪、用户行为分析、数据上报等功能
 * 包含多平台适配器（web/mobile/desktop/miniapp）
 */

// 核心类
export { Analytics } from './core/Analytics';
export { EventQueue } from './core/EventQueue';
export { Uploader } from './core/Uploader';

// 类型定义
export * from './types';

// 客户端工具（单例管理器 + 预设配置）
export * from './client';

// 工具函数
export * from './utils/helpers';
export * from './utils/decorators';
export * from './utils/hooks';

// 平台适配器
export * from './adapters';

// UI 组件（已解决类型冲突：DashboardEvent vs AnalyticsEvent）
export {
  AnalyticsDashboard,
  StatCard,
  EventList,
  FilterPanel,
  PieChart,
  BarChart,
} from './components';
export type {
  AnalyticsDashboardProps,
  StatCardProps,
  EventListProps,
  FilterPanelProps,
  DashboardEvent,
  DashboardStats,
  FilterOptions,
  ChartDataPoint,
} from './components';

// 服务端模块（Server-side）
// 注意：server 模块需要单独导入，避免在客户端打包时引入服务端依赖
// import { createAnalyticsService } from '@qhr123/sa2kit/analytics/server';

// 版本信息
export const ANALYTICS_VERSION = '1.0.0';

