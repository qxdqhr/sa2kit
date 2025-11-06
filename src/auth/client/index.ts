/**
 * Auth Client
 * API 客户端模块
 *
 * @example
 * ```typescript
 * import { BaseApiClient } from '@qhr123/sa2kit/auth/client';
 * import { WebStorageAdapter } from '@qhr123/sa2kit/storage';
 * import { WebRequestAdapter } from '@qhr123/sa2kit/request';
 *
 * const apiClient = new BaseApiClient(
 *   new WebStorageAdapter(),
 *   new WebRequestAdapter(),
 *   '/api'
 * );
 * ```
 */

export { BaseApiClient } from './base-api-client';
export {
  API_ROUTES,
  STORAGE_KEYS,
  type ApiResponse,
  type User,
  type AuthResponse,
} from './types';

