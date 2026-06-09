export { createLegacyLoginHandler } from './login';
export { createLegacyRegisterHandler } from './register';
export { createLegacyLogoutHandler } from './logout';
export { createLegacyValidateHandler } from './validate';
export { createLegacySendVerificationCodeHandler } from './sendVerificationCode';
export { createLegacyResetPasswordHandler } from './resetPassword';
export type {
  LegacyApiResponse,
  LegacyCookieOptions,
  LegacyLoginRouteConfig,
  LegacyRegisterRouteConfig,
  LegacyLogoutRouteConfig,
  LegacyValidateRouteConfig,
  LegacySendVerificationCodeConfig,
  LegacyResetPasswordConfig,
} from './types';
