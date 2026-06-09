import { NextRequest, NextResponse } from 'next/server';
import type { LegacyValidateRouteConfig, LegacyApiResponse } from './types';

export function createLegacyValidateHandler(config: LegacyValidateRouteConfig) {
  return async (request: NextRequest) => {
    try {
      const cookieName = config.cookieOptions?.name || 'session_token';
      const sessionToken = request.cookies.get(cookieName)?.value;

      if (!sessionToken) {
        return NextResponse.json<LegacyApiResponse>(
          { success: true, valid: false, user: null, data: { valid: false, user: null } },
          { status: 200 }
        );
      }

      const validation = await config.authService.validateSession(sessionToken);
      return NextResponse.json<LegacyApiResponse>({
        success: true,
        valid: validation.valid,
        user: validation.user,
        message: validation.valid ? '会话有效' : '会话无效',
        data: validation,
      });
    } catch (error) {
      console.error('💥 [LegacyValidate] 验证异常:', error);
      return NextResponse.json<LegacyApiResponse>(
        { success: false, message: '验证失败' },
        { status: 500 }
      );
    }
  };
}
