/**
 * React Native 认证（Better Auth 3.0 — Bearer + AsyncStorage）
 *
 * @example
 * ```tsx
 * import { initSa2kitRnAuthClient, RnAccountLoginForm } from 'sa2kit/common/auth/rn';
 *
 * const client = await initSa2kitRnAuthClient('http://10.0.2.2:3000/api');
 * ```
 */
export {
  createSa2kitRnAuthClient,
  createSa2kitRnAuthClientFromApiBase,
  initSa2kitRnAuthClient,
  signOutSa2kitRnAuthClient,
  resetSa2kitRnAuthClientCache,
  normalizeRnAuthBaseUrl,
  type Sa2kitRnAuthClient,
  type Sa2kitRnAuthClientOptions,
} from './create-rn-auth-client';

export {
  getRnBearerToken,
  setRnBearerToken,
  clearRnBearerToken,
  setRnBearerTokenStorage,
  RN_BEARER_TOKEN_KEY,
  type RnBearerTokenStorage,
} from './token-storage';

export { signInWithRnAuthClient } from './sign-in';

export {
  RnAccountLoginForm,
  type RnAccountLoginFormProps,
  type RnAccountLoginTheme,
  type RnAccountLoginLabels,
} from './components/AccountLoginForm';

/** @deprecated 3.0 使用 initSa2kitRnAuthClient */
export {
  createRnAuthClient,
  initRnAuthClient,
  resetRnAuthClientCache,
} from './legacy-client';
