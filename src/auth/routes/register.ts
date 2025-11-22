/**
 * Auth Routes - Register
 * 注册路由处理器
 */

import type { RegisterRouteConfig, ApiResponse } from './types';

/**
 * 添加 CORS 头到响应
 */
function addCorsHeaders(response: Response, config: RegisterRouteConfig, request: Request): Response {
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
 * 创建注册路由处理器
 *
 * @example
 * ```typescript
 * import { createRegisterHandler } from 'sa2kit/auth/routes';
 *
 * export const POST = createRegisterHandler({
 *   authService: myAuthService,
 *   defaultRole: 'USER',
 *   cors: { enabled: true },
 * });
 * ```
 */
export function createRegisterHandler(config: RegisterRouteConfig) {
  return async (request: Request) => {
    try {
      // 解析请求体
      const { email, password, username } = await request.json();

      // 验证必填字段
      if (!email || !password) {
        const response = new Response(
          JSON.stringify({
            success: false,
            error: '邮箱和密码不能为空',
          } as ApiResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return addCorsHeaders(response, config, request);
      }

      // 密码强度验证
      if (password.length < 6) {
        const response = new Response(
          JSON.stringify({
            success: false,
            error: '密码长度至少为 6 位',
          } as ApiResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return addCorsHeaders(response, config, request);
      }

      // 执行注册
      const result = await config.authService.signUp(
        email,
        password,
        username,
        config.defaultRole || 'USER'
      );

      // 记录注册成功埋点
      if (config.analytics) {
        try {
          await config.analytics.track('user_register_success', {
            userId: result.user.id,
            email: result.user.email,
            username: result.user.username,
            timestamp: new Date().toISOString(),
          });
        } catch (analyticsError) {
          console.error('Failed to track register analytics:', analyticsError);
        }
      }

      // 创建响应
      const response = new Response(
        JSON.stringify({
          success: true,
          data: {
            user: result.user,
            token: result.token,
          },
          message: '注册成功',
        } as ApiResponse),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // 设置 Cookie（如果有配置）
      if (config.cookieOptions) {
        const cookieOptions = {
          name: config.cookieOptions?.name || 'auth_token',
          httpOnly: config.cookieOptions?.httpOnly !== false,
          secure: config.cookieOptions?.secure !== false && process.env.NODE_ENV === 'production',
          sameSite: config.cookieOptions?.sameSite || 'lax',
          maxAge: config.cookieOptions?.maxAge || 60 * 60 * 24 * 7,
          path: config.cookieOptions?.path || '/',
        };

        const cookieValue = `${cookieOptions.name}=${result.token}; HttpOnly=${cookieOptions.httpOnly}; Secure=${cookieOptions.secure}; SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`;
        response.headers.set('Set-Cookie', cookieValue);
      }

      return addCorsHeaders(response, config, request);
    } catch (error) {
      console.error('Register error:', error);

      // 记录注册失败埋点
      if (config.analytics) {
        try {
          await config.analytics.track('user_register_failed', {
            errorMessage: (error as any).message || '注册失败',
            timestamp: new Date().toISOString(),
          });
        } catch (analyticsError) {
          console.error('Failed to track register failure analytics:', analyticsError);
        }
      }

      const response = new Response(
        JSON.stringify({
          success: false,
          error: (error as any).message || '注册失败',
        } as ApiResponse),
        {
          status: 400,
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
export function createRegisterOptionsHandler(config: RegisterRouteConfig) {
  return async (request: Request) => {
    const response = new Response(null, {
      status: 204,
      headers: {
        'Content-Length': '0',
      },
    });

    // 复用 addCorsHeaders 函数
    if (config.cors?.enabled) {
      const origin = request.headers.get('origin');
      const allowedOrigins = config.cors.origin;

      if (allowedOrigins) {
        if (typeof allowedOrigins === 'string') {
          response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
        } else if (Array.isArray(allowedOrigins) && origin && allowedOrigins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
      } else {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
      }

      if (config.cors.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      const methods = config.cors.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));

      const headers = config.cors.allowedHeaders || ['Content-Type', 'Authorization'];
      response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
    }

    return response;
  };
}

