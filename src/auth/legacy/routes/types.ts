import type { LegacyAuthDbService } from '../services';

export interface LegacyCookieOptions {
  name?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path?: string;
}

export interface LegacyBaseRouteConfig {
  authService: LegacyAuthDbService;
  cookieOptions?: LegacyCookieOptions;
}

export interface LegacyLoginRouteConfig extends LegacyBaseRouteConfig {}
export interface LegacyRegisterRouteConfig extends LegacyBaseRouteConfig {}
export interface LegacyLogoutRouteConfig extends LegacyBaseRouteConfig {}
export interface LegacyValidateRouteConfig extends LegacyBaseRouteConfig {}
export interface LegacySendVerificationCodeConfig extends LegacyBaseRouteConfig {}
export interface LegacyResetPasswordConfig extends LegacyBaseRouteConfig {}

export interface LegacyApiResponse<T = any> {
  success: boolean;
  message?: string;
  user?: any;
  sessionToken?: string;
  valid?: boolean;
  data?: T;
}
