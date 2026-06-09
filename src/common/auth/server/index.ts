/**
 * @package sa2kit/common/auth/server
 *
 * Node / API 服务端入口（R2-211）。
 */
export {
  userRole,
  user,
  session,
  account,
  verifications,
  userRelations,
  sessionRelations,
  accountRelations,
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

export {
  DrizzleAuthService,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyJwtToken,
  getTokenFromRequest,
  type UserInfo,
  type AuthResult,
  type SessionInfo,
  type VerifyResult,
  type AuthServiceConfig,
  type JwtPayload,
} from '../services';

export { validateApiAuth, validateApiAuthNumeric } from '../server';

export {
  createLoginHandler,
  createLoginOptionsHandler,
  createRegisterHandler,
  createRegisterOptionsHandler,
  createMeHandler,
  createMeOptionsHandler,
  createLogoutHandler,
  createLogoutOptionsHandler,
  createDefaultBaseConfig,
  createDefaultLoginConfig,
  createDefaultRegisterConfig,
  createAnalyticsAdapter,
  type BaseRouteConfig,
  type LoginRouteConfig,
  type RegisterRouteConfig,
  type ApiResponse,
  type AnalyticsEvent,
  type AnalyticsService,
} from '../routes';

export {
  createAuthMiddleware,
  type AuthLevel,
  type RouteContext,
  type RouteHandler,
  type AuthMiddlewareConfig,
} from '../middleware';
