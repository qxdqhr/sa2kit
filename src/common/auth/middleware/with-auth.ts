/**
 * Auth Middleware - withAuth
 * 认证中间件
 */

import { getTokenFromRequest } from '../services';
import type {
  AuthMiddlewareConfig,
  AuthLevel,
  RouteHandler,
  RouteContext,
} from './types';

/**
 * 创建认证中间件
 *
 * @example
 * ```typescript
 * import { createAuthMiddleware } from '@qhr123/sa2kit/auth/middleware';
 *
 * const { withAuth, requireAdmin } = createAuthMiddleware({
 *   authService: myAuthService,
 * });
 *
 * // 使用中间件
 * export const GET = requireAdmin(async (request, context) => {
 *   const { user } = context; // 自动注入用户信息
 *   // ... 业务逻辑
 * });
 * ```
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig) {
  /**
   * 认证中间件核心函数
   */
  function withAuth(
    handler: RouteHandler,
    level: AuthLevel = 'user'
  ): RouteHandler {
    return async (request: Request, context: RouteContext = {}) => {
      // 不需要认证，直接执行
      if (level === 'none') {
        return await handler(request, context);
      }

      try {
        // 获取 token
        const token = getTokenFromRequest(request);

        if (!token) {
          return new Response(
            JSON.stringify({
              success: false,
              error: '未提供认证令牌',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // 验证 token 并获取用户信息
        const result = await config.authService.verifyToken(token);

        // 检查权限级别
        if (level === 'admin' || level === 'super_admin') {
          if (!['ADMIN', 'SUPER_ADMIN'].includes(result.user.role)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: '需要管理员权限',
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }

        if (level === 'super_admin') {
          if (result.user.role !== 'SUPER_ADMIN') {
            return new Response(
              JSON.stringify({
                success: false,
                error: '需要超级管理员权限',
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }

        // 注入用户信息到 context
        context.user = result.user;
        context.session = result.session;

        // 执行业务逻辑
        return await handler(request, context);
      } catch (error) {
        console.error('Auth middleware error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: '认证失败',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    };
  }

  /**
   * 快捷方法：需要用户登录
   */
  function requireAuth(handler: RouteHandler): RouteHandler {
    return withAuth(handler, 'user');
  }

  /**
   * 快捷方法：需要管理员权限
   */
  function requireAdmin(handler: RouteHandler): RouteHandler {
    return withAuth(handler, 'admin');
  }

  /**
   * 快捷方法：需要超级管理员权限
   */
  function requireSuperAdmin(handler: RouteHandler): RouteHandler {
    return withAuth(handler, 'super_admin');
  }

  return {
    withAuth,
    requireAuth,
    requireAdmin,
    requireSuperAdmin,
  };
}

