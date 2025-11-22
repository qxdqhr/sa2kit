/**
 * Auth Routes - Me
 * 获取当前用户信息路由处理器
 */

import { getTokenFromRequest } from '../services';
import type { BaseRouteConfig, ApiResponse } from './types';

/**
 * 添加 CORS 头到响应
 */
function addCorsHeaders(response: Response, config: BaseRouteConfig, request: Request): Response {
  if (!config.cors?.enabled) return response;

  const origin = request.headers.get('origin');
  const allowedOrigins = config.cors.origin;

  // 处理允许的源
  if (allowedOrigins) {
    if (typeof allowedOrigins === 'string') {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    } else if (Array.isArray(allowedOrigins) && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  } else {
    // 默认允许所有源
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }

  if (config.cors.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  const methods = config.cors.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));

  const headers = config.cors.allowedHeaders || ['Content-Type', 'Authorization'];
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));

  return response;
}

/**
 * 创建获取当前用户信息路由处理器
 *
 * @example
 * ```typescript
 * import { createMeHandler } from 'sa2kit/auth/routes';
 *
 * export const GET = createMeHandler({
 *   authService: myAuthService,
 *   cors: { enabled: true },
 * });
 * ```
 */
export function createMeHandler(config: BaseRouteConfig) {
  return async (request: Request) => {
    try {
      // 获取 token
      const token = getTokenFromRequest(request);

      if (!token) {
        const response = new Response(
          JSON.stringify({
            success: false,
            error: '未提供认证令牌',
          } as ApiResponse),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return addCorsHeaders(response, config, request);
      }

      // 验证 token 并获取用户信息
      const result = await config.authService.verifyToken(token);

      const response = new Response(
        JSON.stringify({
          success: true,
          data: result.user,
        } as ApiResponse),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return addCorsHeaders(response, config, request);
    } catch (error) {
      console.error('Get user info error:', error);

      const response = new Response(
        JSON.stringify({
          success: false,
          error: '认证失败',
        } as ApiResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return addCorsHeaders(response, config, request);
    }
  };
}

/**
 * 创建 CORS 预检请求处理器
 */
export function createMeOptionsHandler(config: BaseRouteConfig) {
  return async (request: Request) => {
    const response = new Response(null, {
      status: 204,
      headers: {
        'Content-Length': '0',
      },
    });

    return addCorsHeaders(response, config, request);
  };
}
