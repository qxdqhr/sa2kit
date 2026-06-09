/**
 * Auth Routes - Login
 * 登录路由处理器
 */

import type { LoginRouteConfig, ApiResponse } from './types';

/**
 * 添加 CORS 头到响应
 */
function addCorsHeaders(response: Response, config: LoginRouteConfig, request: Request): Response {
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
 * 创建登录路由处理器
 *
 * @example
 * ```typescript
 * import { createLoginHandler } from 'sa2kit/auth/routes';
 *
 * export const POST = createLoginHandler({
 *   authService: myAuthService,
 *   analytics: myAnalytics,
 *   cors: { enabled: true },
 * });
 * ```
 */
export function createLoginHandler(config: LoginRouteConfig) {
  return async (request: Request) => {
    let requestBody: any = {};

    try {
      // 解析请求体
      requestBody = await request.json();
      const { email, password } = requestBody;

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

      // 执行登录
      const result = await config.authService.signIn(email, password);

      // 记录登录成功埋点
      if (config.analytics) {
        try {
          await config.analytics.track('user_login_success', {
            userId: result.user.id,
            userRole: result.user.role,
            email: result.user.email,
            loginMethod: 'email_password',
            timestamp: new Date().toISOString(),
          });
        } catch (analyticsError) {
          console.error('Failed to track login analytics:', analyticsError);
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
          message: '登录成功',
        } as ApiResponse),
        {
          status: 200,
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
          maxAge: config.cookieOptions?.maxAge || 60 * 60 * 24 * 7, // 7天
          path: config.cookieOptions?.path || '/',
        };

        // 设置 Set-Cookie header
        const cookieValue = (cookieOptions.name) + '=' + (result.token) + '; HttpOnly=' + (cookieOptions.httpOnly) + '; Secure=' + (cookieOptions.secure) + '; SameSite=' + (cookieOptions.sameSite) + '; Max-Age=' + (cookieOptions.maxAge) + '; Path=' + (cookieOptions.path);
        response.headers.set('Set-Cookie', cookieValue);
      }

      return addCorsHeaders(response, config, request);
    } catch (error) {
      console.error('Login error:', error);

      // 记录登录失败埋点
      if (config.analytics) {
        try {
          await config.analytics.track('user_login_failed', {
            errorMessage: (error as any).message || '登录失败',
            email: requestBody.email,
            timestamp: new Date().toISOString(),
          });
        } catch (analyticsError) {
          console.error('Failed to track login failure analytics:', analyticsError);
        }
      }

      const response = new Response(
        JSON.stringify({
          success: false,
          error: (error as any).message || '登录失败，请检查邮箱和密码',
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
export function createLoginOptionsHandler(config: LoginRouteConfig) {
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

