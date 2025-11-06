/**
 * Auth Routes - Login
 * 登录路由处理器
 */

import type { LoginRouteConfig, ApiResponse } from './types';

/**
 * 创建登录路由处理器
 *
 * @example
 * ```typescript
 * import { createLoginHandler } from '@qhr123/sa2kit/auth/routes';
 *
 * export const POST = createLoginHandler({
 *   authService: myAuthService,
 *   analytics: myAnalytics,
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
        return new Response(
          JSON.stringify({
            success: false,
            error: '邮箱和密码不能为空',
          } as ApiResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
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
        const cookieValue = `${cookieOptions.name}=${result.token}; HttpOnly=${cookieOptions.httpOnly}; Secure=${cookieOptions.secure}; SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`;
        response.headers.set('Set-Cookie', cookieValue);
      }

      return response;
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

      return new Response(
        JSON.stringify({
          success: false,
          error: (error as any).message || '登录失败，请检查邮箱和密码',
        } as ApiResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

