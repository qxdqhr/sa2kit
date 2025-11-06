/**
 * Auth Routes - Logout
 * 登出路由处理器
 */

import { getTokenFromRequest } from '../services';
import type { BaseRouteConfig, ApiResponse } from './types';

/**
 * 创建登出路由处理器
 *
 * @example
 * ```typescript
 * import { createLogoutHandler } from '@qhr123/sa2kit/auth/routes';
 *
 * export const POST = createLogoutHandler({
 *   authService: myAuthService,
 * });
 * ```
 */
export function createLogoutHandler(config: BaseRouteConfig) {
  return async (request: Request) => {
    try {
      // 获取 token
      const token = getTokenFromRequest(request);

      if (!token) {
        return new Response(
          JSON.stringify({
            success: false,
            error: '未提供认证令牌',
          } as ApiResponse),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // 删除会话
      await config.authService.signOut(token);

      // 记录登出埋点
      if (config.analytics) {
        try {
          await config.analytics.track('user_logout', {
            timestamp: new Date().toISOString(),
          });
        } catch (analyticsError) {
          console.error('Failed to track logout analytics:', analyticsError);
        }
      }

      // 创建响应并清除 Cookie
      const response = new Response(
        JSON.stringify({
          success: true,
          message: '登出成功',
        } as ApiResponse),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // 清除 auth_token cookie
      response.headers.set(
        'Set-Cookie',
        'auth_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
      );

      return response;
    } catch (error) {
      console.error('Logout error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: '登出失败',
        } as ApiResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

