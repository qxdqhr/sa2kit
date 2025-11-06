/**
 * Auth Middleware - Types
 * 认证中间件类型定义
 */

import type { DrizzleAuthService, UserInfo, SessionInfo } from '../services';

/**
 * 认证级别
 */
export type AuthLevel = 'none' | 'user' | 'admin' | 'super_admin';

/**
 * 路由上下文
 */
export interface RouteContext {
  /**
   * 用户信息（认证后注入）
   */
  user?: UserInfo;

  /**
   * 会话信息（认证后注入）
   */
  session?: SessionInfo;

  /**
   * 路由参数
   */
  params?: any;
}

/**
 * 路由处理器
 */
export type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareConfig {
  /**
   * 认证服务实例
   */
  authService: DrizzleAuthService;
}

