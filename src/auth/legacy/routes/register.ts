import { NextRequest, NextResponse } from 'next/server';
import { validatePhoneNumber, validatePassword } from '../utils/authUtils';
import type { LegacyRegisterRouteConfig, LegacyApiResponse } from './types';

export function createLegacyRegisterHandler(config: LegacyRegisterRouteConfig) {
  return async (request: NextRequest) => {
    try {
      const { phone, password, name } = await request.json();

      if (!phone || !password) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '请输入手机号和密码' },
          { status: 400 }
        );
      }

      if (!validatePhoneNumber(phone)) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '请输入正确的手机号格式' },
          { status: 400 }
        );
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: passwordValidation.message || '密码格式错误' },
          { status: 400 }
        );
      }

      const user = await config.authService.createUser(phone, password, name);
      const session = await config.authService.createSession(user.id);
      await config.authService.updateLastLogin(user.id);

      const response = NextResponse.json<LegacyApiResponse>({
        success: true,
        message: '注册成功',
        user,
        sessionToken: session.sessionToken,
        data: { user, sessionToken: session.sessionToken },
      });

      const cookieOptions = {
        name: config.cookieOptions?.name || 'session_token',
        httpOnly: config.cookieOptions?.httpOnly !== false,
        secure: config.cookieOptions?.secure || false,
        sameSite: config.cookieOptions?.sameSite || 'lax',
        maxAge: config.cookieOptions?.maxAge || 30 * 24 * 60 * 60,
        path: config.cookieOptions?.path || '/',
      };

      response.cookies.set(cookieOptions.name, session.sessionToken, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      });

      return response;
    } catch (error) {
      console.error('💥 [LegacyRegister] 注册异常:', error);
      return NextResponse.json<LegacyApiResponse>(
        { success: false, message: '注册失败，请稍后重试' },
        { status: 500 }
      );
    }
  };
}
