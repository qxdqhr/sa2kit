/**
 * @package sa2kit/common/auth
 *
 * Browser / client 安全入口（Better Auth 3.0）
 */
export { createSa2kitAuthClient, type Sa2kitAuthClient, type Sa2kitAuthClientOptions } from './client';
export { useSession, type UseSessionReturn } from './hooks/useSession';

/** @deprecated 3.0 请使用 createSa2kitAuthClient + useSession */
export { useAuth, useAuthForm } from './hooks/useAuth';
/** @deprecated 3.0 请使用 createSa2kitAuthClient */
export { BaseApiClient, API_ROUTES, STORAGE_KEYS } from './client';

export type { LoginFormState, RegisterFormState } from './components/types';
export * from './types';
