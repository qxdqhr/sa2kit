/**
 * Auth Middleware
 * 认证中间件
 *
 * @example
 * ```typescript
 * import { createAuthMiddleware } from '@qhr123/sa2kit/auth/middleware';
 *
 * const { withAuth, requireAdmin } = createAuthMiddleware({
 *   authService: myAuthService,
 * });
 * ```
 */

export { createAuthMiddleware } from './with-auth';
export type {
  AuthLevel,
  RouteContext,
  RouteHandler,
  AuthMiddlewareConfig,
} from './types';

