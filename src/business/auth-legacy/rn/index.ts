/**
 * Legacy RN 认证（手机号 /auth/login 等），依赖 common/auth RN client
 * @deprecated 新应用请使用 `sa2kit/common/auth/rn` + 新 auth API
 */
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
