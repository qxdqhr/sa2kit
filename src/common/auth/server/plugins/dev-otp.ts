/**
 * 开发 / 测试环境 OTP 输出（禁止生产依赖）
 */
export function createDevOtpLogger(enabled: boolean) {
  if (!enabled || process.env.NODE_ENV === 'production') {
    return undefined;
  }
  return (channel: 'sms' | 'email', target: string, code: string) => {
    console.info(`[sa2kit/auth][dev-otp][${channel}] ${target} => ${code}`);
  };
}

export const defaultPhoneValidator = (phoneNumber: string) => /^1\d{10}$/.test(phoneNumber);

export const defaultTempEmailFromPhone = (phoneNumber: string) =>
  `${phoneNumber.replace(/\D/g, '')}@phone.sa2kit.local`;
