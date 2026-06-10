import { validateEmail, validatePhoneNumber } from '../components/utils';
import { getAuthClientError, errorMessage } from '../components/utils';
import type { Sa2kitRnAuthClient } from './create-rn-auth-client';

type AuthClientLike = Sa2kitRnAuthClient & Record<string, unknown>;

function clientApi(client: Sa2kitRnAuthClient): AuthClientLike {
  return client as AuthClientLike;
}

export async function signInWithRnAuthClient(
  authClient: Sa2kitRnAuthClient,
  account: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmed = account.trim();
  try {
    if (validatePhoneNumber(trimmed)) {
      const result = await clientApi(authClient).signIn.phoneNumber({
        phoneNumber: trimmed,
        password,
      });
      const err = getAuthClientError(result, '登录失败');
      return err ? { success: false, error: err } : { success: true };
    }

    if (validateEmail(trimmed)) {
      const result = await clientApi(authClient).signIn.email({
        email: trimmed,
        password,
      });
      const err = getAuthClientError(result, '登录失败');
      return err ? { success: false, error: err } : { success: true };
    }

    return { success: false, error: '请输入正确的手机号或邮箱' };
  } catch (e) {
    return { success: false, error: errorMessage(e, '登录失败') };
  }
}
