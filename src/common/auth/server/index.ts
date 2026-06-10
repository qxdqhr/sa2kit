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
