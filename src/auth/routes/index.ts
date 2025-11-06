/**
 * Auth Routes
 * API 路由处理器工厂函数
 *
 * @example
 * ```typescript
 * // Next.js App Router
 * import { createLoginHandler } from '@qhr123/sa2kit/auth/routes';
 *
 * export const POST = createLoginHandler({
 *   authService: myAuthService,
 *   analytics: myAnalytics,
 * });
 * ```
 */

export { createLoginHandler } from './login';
export { createRegisterHandler } from './register';
export { createMeHandler } from './me';
export { createLogoutHandler } from './logout';

export type {
  BaseRouteConfig,
  LoginRouteConfig,
  RegisterRouteConfig,
  ApiResponse,
} from './types';

