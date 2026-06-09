import { NextRequest, NextResponse } from 'next/server';
import type { LegacyLogoutRouteConfig, LegacyApiResponse } from './types';

export function createLegacyLogoutHandler(config: LegacyLogoutRouteConfig) {
  return async (request: NextRequest) => {
    try {
      const cookieName = config.cookieOptions?.name || 'session_token';
      const sessionToken = request.cookies.get(cookieName)?.value;

      if (sessionToken) {
        await config.authService.deleteSession(sessionToken);
      }

      const response = NextResponse.json<LegacyApiResponse>({
        success: true,
        message: '登出成功',
      });

      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: config.cookieOptions?.secure || false,
        sameSite: config.cookieOptions?.sameSite || 'lax',
        maxAge: 0,
        path: config.cookieOptions?.path || '/',
      });

      return response;
    } catch (error) {
      console.error('💥 [LegacyLogout] 登出异常:', error);
      return NextResponse.json<LegacyApiResponse>(
        { success: false, message: '登出失败，请稍后重试' },
        { status: 500 }
      );
    }
  };
}
