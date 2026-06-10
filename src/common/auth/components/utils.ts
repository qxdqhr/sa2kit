/** 中国大陆手机号 */
export function validatePhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) return { valid: false, message: '密码不能为空' };
  if (password.length < 6) return { valid: false, message: '密码长度至少 6 位' };
  return { valid: true };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type AuthClientResult = {
  error?: { message?: string; statusText?: string } | null;
  data?: unknown;
};

export function getAuthClientError(result: unknown, fallback: string): string | null {
  const r = result as AuthClientResult | null | undefined;
  if (!r?.error) return null;
  return r.error.message ?? r.error.statusText ?? fallback;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
