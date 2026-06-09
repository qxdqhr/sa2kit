/**
 * @package sa2kit/common/auth
 *
 * Browser / client 安全入口（R2-211）。
 */
export { useAuth, useAuthForm } from './hooks';
export { BaseApiClient, API_ROUTES, STORAGE_KEYS } from './client';
export type { LoginFormState, RegisterFormState } from './components/types';
export * from './types';
