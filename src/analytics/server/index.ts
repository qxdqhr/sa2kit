/**
 * 埋点系统服务端模块
 * Analytics Server Module
 *
 * ⚠️ 注意：此模块仅用于服务端
 * 请勿在客户端代码中导入，以避免打包服务端依赖
 *
 * 使用示例：
 *
 * ```typescript
 * // 1. 导入 schema 到你的数据库 schema 文件
 * import { analyticsEvents } from '@qhr123/sa2kit/analytics/server'
 * export { analyticsEvents }
 *
 * // 2. 创建服务
 * import { createAnalyticsService } from '@qhr123/sa2kit/analytics/server'
 * const service = createAnalyticsService(db, analyticsEvents, logger)
 *
 * // 3. 创建 API 处理器
 * import { createAnalyticsHandlers } from '@qhr123/sa2kit/analytics/server'
 * import { NextResponse } from 'next/server'
 * const handlers = createAnalyticsHandlers(service, NextResponse)
 *
 * // 4. 在路由中使用
 * export const POST = handlers.handleEventsPost
 * export const GET = handlers.handleQueryGet
 * ```
 */

// 导出数据库 schema
export * from './schema';

// 导出类型
export * from './types';

// 导出服务
export * from './service';

// 导出处理器
export * from './handlers';
