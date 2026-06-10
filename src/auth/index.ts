/**
 * @deprecated 3.0 请使用 `sa2kit/common/auth` + `sa2kit/common/auth/server`
 */
export * from '../common/auth/schema';
export {
  createSa2kitAuth,
  mountNextAuthHandler,
  mountAuthHandler,
  createAuthRouteHandlers,
  createSessionValidator,
  getSessionUser,
  getSessionUserNumeric,
  authDrizzleSchema,
} from '../common/auth/server';
export { createSa2kitAuthClient } from '../common/auth/client';
export { useSession } from '../common/auth/hooks/useSession';
export {
  useAuth,
  useAuthForm,
} from '../common/auth/hooks';
export type { User, AuthResult, UseAuthReturn } from '../common/auth/types';
export { BaseApiClient, API_ROUTES, STORAGE_KEYS } from '../common/auth/client';
export type { LoginFormState, RegisterFormState } from '../common/auth/components/types';
