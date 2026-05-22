/**
 * React Native 认证子包
 *
 * @example
 * ```tsx
 * import { RnAccountLoginForm, initRnAuthClient } from 'sa2kit/auth/rn';
 *
 * <RnAccountLoginForm
 *   authApiBase="http://10.0.2.2:3000/api"
 *   defaultAuthApiBase="http://10.0.2.2:3000/api"
 *   onAuthApiBaseChange={setAuthBase}
 *   onSuccess={(token) => saveToken(token)}
 * />
 * ```
 */

export {
  createRnAuthClient,
  initRnAuthClient,
  resetRnAuthClientCache,
} from './client';

export {
  loginWithLegacyPhone,
  isPhoneAccount,
  type LegacyPhoneLoginResult,
} from './legacy-login';

export { RnAccountLoginForm } from './components/AccountLoginForm';

export type {
  RnAccountLoginFormProps,
  RnAccountLoginTheme,
  RnAccountLoginLabels,
} from './types';
