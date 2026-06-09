/**
 * @deprecated 请使用 `sa2kit/common/auth` 或 `sa2kit/common/auth/server`
 */
export * from '../common/auth/schema';
export * from '../common/auth/services';
export { validateApiAuth, validateApiAuthNumeric } from '../common/auth/server';
export * from '../common/auth/routes';
export * from '../common/auth/middleware';
export {
  useAuth,
  useAuthForm,
  type User,
  type AuthResult,
  type UseAuthReturn,
} from '../common/auth/hooks';
export { BaseApiClient, API_ROUTES, STORAGE_KEYS } from '../common/auth/client';
export type { LoginFormState, RegisterFormState } from '../common/auth/components/types';
