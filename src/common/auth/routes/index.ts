/**
 * Auth Routes
 * API 路由处理器工厂函数
 *
 * @example
 * ```typescript
 * // Next.js App Router
 * import { createLoginHandler, createLoginOptionsHandler } from 'sa2kit/auth/routes';
 *
 * export const POST = createLoginHandler({
 *   authService: myAuthService,
 *   analytics: myAnalytics,
 *   cors: { enabled: true },
 * });
 *
 * export const OPTIONS = createLoginOptionsHandler({
 *   authService: myAuthService,
 *   cors: { enabled: true },
 * });
 * ```
 */

export { createLoginHandler, createLoginOptionsHandler } from './login';
export { createRegisterHandler, createRegisterOptionsHandler } from './register';
export { createMeHandler, createMeOptionsHandler } from './me';
export { createLogoutHandler, createLogoutOptionsHandler } from './logout';

// 默认配置工厂函数
export {
  createDefaultBaseConfig,
  createDefaultLoginConfig,
  createDefaultRegisterConfig,
} from './defaults';

// 埋点适配器
export {
  createAnalyticsAdapter,
  type AnalyticsEvent,
  type AnalyticsService,
} from './analytics-adapter';

export type {
  BaseRouteConfig,
  LoginRouteConfig,
  RegisterRouteConfig,
  ApiResponse,
} from './types';

