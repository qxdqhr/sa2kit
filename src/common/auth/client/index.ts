/**
 * Auth Client（3.0 Better Auth + 兼容 2.x BaseApiClient）
 */
export { createSa2kitAuthClient, type Sa2kitAuthClient, type Sa2kitAuthClientOptions } from './create-auth-client';

/** @deprecated 3.0 使用 createSa2kitAuthClient */
export { BaseApiClient } from './base-api-client';
export { API_ROUTES, STORAGE_KEYS } from './types';
export type { ApiResponse, User, AuthResponse } from './types';
