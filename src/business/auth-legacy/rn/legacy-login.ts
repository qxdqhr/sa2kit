import { validatePhoneNumber } from '../utils/authUtils';
import { ReactNativeRequestAdapter } from '../../../request/adapters/react-native-adapter';

export type LegacyPhoneLoginResult = {
  success: boolean;
  token?: string;
  message?: string;
};

type LegacyLoginBody = {
  success?: boolean;
  message?: string;
  sessionToken?: string;
  data?: { sessionToken?: string };
};

/** profile-v1 等 legacy：POST {authApiBase}/auth/login { phone, password } */
export async function loginWithLegacyPhone(
  authApiBase: string,
  phone: string,
  password: string,
): Promise<LegacyPhoneLoginResult> {
  const trimmedPhone = phone.trim();
  if (!trimmedPhone || !password) {
    return { success: false, message: '请填写手机号和密码' };
  }
  if (!validatePhoneNumber(trimmedPhone)) {
    return { success: false, message: '请输入正确的手机号' };
  }

  const base = authApiBase.replace(/\/+$/, '');
  const adapter = new ReactNativeRequestAdapter();
  const data = await adapter.request<LegacyLoginBody>({
    url: `${base}/auth/login`,
    method: 'POST',
    body: { phone: trimmedPhone, password },
  });

  if (!data.success) {
    return {
      success: false,
      message: data.message ?? '登录失败',
    };
  }

  const token = data.sessionToken ?? data.data?.sessionToken;
  if (!token || token.length < 8) {
    return { success: false, message: '登录成功但未返回有效会话令牌' };
  }

  return { success: true, token };
}

export function isPhoneAccount(account: string): boolean {
  return validatePhoneNumber(account.trim());
}
