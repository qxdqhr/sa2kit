/**
 * Auth Routes - Me
 * 获取当前用户信息路由处理器
 */

import { getTokenFromRequest } from '../services';
import type { BaseRouteConfig, ApiResponse } from './types';

/**
 * 创建获取当前用户信息路由处理器
 *
 * @example
 * ```typescript
 * import { createMeHandler } from '@qhr123/sa2kit/auth/routes';
 *
 * export const GET = createMeHandler({
 *   authService: myAuthService,
 * });
 * ```
 */
export function createMeHandler(config: BaseRouteConfig) {
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

      // 验证 token 并获取用户信息
      const result = await config.authService.verifyToken(token);

      return new Response(
        JSON.stringify({
          success: true,
          data: result.user,
        } as ApiResponse),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Get user info error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: '认证失败',
        } as ApiResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

