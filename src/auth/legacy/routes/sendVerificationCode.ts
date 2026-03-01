import { NextRequest, NextResponse } from 'next/server';
import { validatePhoneNumber } from '../utils/authUtils';
import type { LegacySendVerificationCodeConfig, LegacyApiResponse } from './types';

export function createLegacySendVerificationCodeHandler(config: LegacySendVerificationCodeConfig) {
  return async (request: NextRequest) => {
    try {
      const { phone } = await request.json();
      if (!validatePhoneNumber(phone)) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '请输入正确的手机号格式' },
          { status: 400 }
        );
      }

      const user = await config.authService.getUserByPhone(phone);
      if (!user) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '该手机号未注册' },
          { status: 404 }
        );
      }

      await config.authService.sendVerificationCode(phone);
      return NextResponse.json<LegacyApiResponse>({
        success: true,
        message: '验证码已发送',
      });
    } catch (error) {
      console.error('💥 [LegacySendVerificationCode] 发送异常:', error);
      return NextResponse.json<LegacyApiResponse>(
        { success: false, message: '发送验证码失败，请稍后重试' },
        { status: 500 }
      );
    }
  };
}
