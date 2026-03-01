import { NextRequest, NextResponse } from 'next/server';
import type { LegacyValidateRouteConfig, LegacyApiResponse } from './types';

export function createLegacyValidateHandler(config: LegacyValidateRouteConfig) {
  return async (request: NextRequest) => {
    try {
      const cookieName = config.cookieOptions?.name || 'session_token';
      const sessionToken = request.cookies.get(cookieName)?.value;

      if (!sessionToken) {
        return NextResponse.json<LegacyApiResponse>(
          { success: true, data: { valid: false } },
          { status: 200 }
        );
      }

      const validation = await config.authService.validateSession(sessionToken);
      return NextResponse.json<LegacyApiResponse>({
        success: true,
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
