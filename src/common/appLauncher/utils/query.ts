import { AppLaunchError } from '../types';

export function requireNonEmptyString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppLaunchError('INVALID_PARAMS', `${field} 不能为空`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function encodeQuery(value: string): string {
  return encodeURIComponent(value);
}

export function appendQuery(url: string, key: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
