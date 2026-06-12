/**
 * @package sa2kit/common/auth/server
 *
 * Better Auth 3.0 服务端入口
 */
export {
  userRole,
  user,
  session,
  account,
  verification,
  verifications,
  userRelations,
  sessionRelations,
  accountRelations,
  authDrizzleSchema,
  type UserRole,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
} from '../schema';

export { createSa2kitAuth, type Sa2kitAuthInstance } from './create-auth';
export { createSa2kitAuthFromEnv } from './create-auth-from-env';
export { createSa2kitAuthFromAppConfig } from './create-auth-from-app-config';
export type { Sa2kitAuthConfig, Sa2kitSmsProvider, Sa2kitEmailProvider, Sa2kitAuth } from './types';

export { mountNextAuthHandler } from './handler/next';
export { mountAuthHandler, createAuthRouteHandlers } from './handler/hono';

export {
  getSessionUser,
  getSessionUserNumeric,
  createSessionValidator,
  type SessionUser,
} from './session';

export { defaultPhoneValidator, defaultTempEmailFromPhone } from './plugins/dev-otp';

export {
  createSmsProviderFromEnv,
  createConsoleSmsProvider,
  createAliyunPnvsSmsProvider,
  resolveSmsProviderId,
  type Sa2kitSmsProviderId,
  type AliyunPnvsSmsConfig,
} from './sms';

export {
  AUTH_ENV_CATALOG,
  AUTH_FEATURES,
  AUTH_ENV_ALIASES,
  resolveAuthEnv,
  checkAuthEnv,
  checkAuthEnvFromProcessEnv,
  logAuthEnvReport,
  formatAuthEnvSetupMarkdown,
  type AuthEnvReport,
  type AuthEnvIssue,
  type AuthEnvVarDefinition,
  type AuthFeatureDefinition,
} from './env';

export {
  handlePhoneSignupIntentRequest,
  stashPhoneSignupPassword,
  consumePhoneSignupPassword,
} from './phone-signup-intent';

export { upsertCredentialPassword } from './credential-password';
