/**
 * Auth Routes - Default Configurations
 * 默认路由配置
 */

import type { 
  BaseRouteConfig, 
  LoginRouteConfig, 
  RegisterRouteConfig 
} from './types';
import type { DrizzleAuthService } from '../services';

/**
 * 创建默认的基础路由配置
 */
export function createDefaultBaseConfig(
  authService: DrizzleAuthService,
  overrides?: Partial<BaseRouteConfig>
): BaseRouteConfig {
  return {
    authService,
    cors: {
      enabled: true,
      credentials: true,
      ...overrides?.cors,
    },
    analytics: overrides?.analytics,
  };
}

/**
 * 创建默认的登录路由配置
 */
export function createDefaultLoginConfig(
  authService: DrizzleAuthService,
  overrides?: Partial<LoginRouteConfig>
): LoginRouteConfig {
  return {
    authService,
    cors: {
      enabled: true,
      credentials: true,
      ...overrides?.cors,
    },
    cookieOptions: {
      name: 'auth_token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
      ...overrides?.cookieOptions,
    },
    analytics: overrides?.analytics,
  };
}

/**
 * 创建默认的注册路由配置
 */
export function createDefaultRegisterConfig(
  authService: DrizzleAuthService,
  overrides?: Partial<RegisterRouteConfig>
): RegisterRouteConfig {
  return {
    authService,
    defaultRole: overrides?.defaultRole || 'USER',
    cors: {
      enabled: true,
      credentials: true,
      ...overrides?.cors,
    },
    cookieOptions: overrides?.cookieOptions !== undefined ? {
      name: 'auth_token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
      ...overrides.cookieOptions,
    } : undefined,
    analytics: overrides?.analytics,
    emailVerificationRequired: overrides?.emailVerificationRequired,
  };
}

