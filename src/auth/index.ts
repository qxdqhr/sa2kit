/**
 * Sa2kit Auth Module
 * 完整的认证解决方案
 *
 * @example
 * ```typescript
 * // 导入 Schema
 * import { user, session } from '@qhr123/sa2kit/auth/schema';
 *
 * // 导入服务
 * import { DrizzleAuthService } from '@qhr123/sa2kit/auth/services';
 *
 * // 导入路由
 * import { createLoginHandler } from '@qhr123/sa2kit/auth/routes';
 *
 * // 导入中间件
 * import { createAuthMiddleware } from '@qhr123/sa2kit/auth/middleware';
 *
 * // 导入 Hooks
 * import { useAuth } from '@qhr123/sa2kit/auth/hooks';
 * ```
 */

// Schema
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
} from './schema';

// Services
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
} from './services';

// Routes
export {
  createLoginHandler,
  createRegisterHandler,
  createMeHandler,
  createLogoutHandler,
  type BaseRouteConfig,
  type LoginRouteConfig,
  type RegisterRouteConfig,
  type ApiResponse,
} from './routes';

// Middleware
export {
  createAuthMiddleware,
  type AuthLevel,
  type RouteContext,
  type RouteHandler,
  type AuthMiddlewareConfig,
} from './middleware';

// Hooks
export { useAuth, useAuthForm } from './hooks';

// Types
export * from './types';
