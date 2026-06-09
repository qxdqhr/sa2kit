/**
 * React Native 认证子包（新 auth API）
 *
 * @example
 * ```tsx
 * import { initRnAuthClient } from 'sa2kit/common/auth/rn';
 *
 * const client = await initRnAuthClient('http://10.0.2.2:3000/api');
 * ```
 *
 * Legacy 手机号登录与 `RnAccountLoginForm` 见 `sa2kit/auth/rn`（business/auth-legacy）。
 */

export {
  createRnAuthClient,
  initRnAuthClient,
  resetRnAuthClientCache,
} from './client';
