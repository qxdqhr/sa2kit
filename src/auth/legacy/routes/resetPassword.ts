import { NextRequest, NextResponse } from 'next/server';
import { validatePhoneNumber, validatePassword } from '../utils/authUtils';
import type { LegacyResetPasswordConfig, LegacyApiResponse } from './types';

export function createLegacyResetPasswordHandler(config: LegacyResetPasswordConfig) {
  return async (request: NextRequest) => {
    try {
      const { phone, newPassword, verificationCode } = await request.json();

      if (!validatePhoneNumber(phone)) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '请输入正确的手机号格式' },
          { status: 400 }
        );
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: passwordValidation.message || '密码格式错误' },
          { status: 400 }
        );
      }

      const isValidCode = await config.authService.verifyCode(phone, verificationCode);
      if (!isValidCode) {
        return NextResponse.json<LegacyApiResponse>(
          { success: false, message: '验证码无效或已过期' },
          { status: 400 }
        );
      }

      await config.authService.resetPassword(phone, newPassword);
      return NextResponse.json<LegacyApiResponse>({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      console.error('💥 [LegacyResetPassword] 重置异常:', error);
      return NextResponse.json<LegacyApiResponse>(
        { success: false, message: '重置密码失败，请稍后重试' },
        { status: 500 }
      );
    }
  };
}
