/**
 * Auth Routes - Types
 * 路由处理器类型定义
 */

import type { DrizzleAuthService } from '../services';

/**
 * 基础路由配置
 */
export interface BaseRouteConfig {
  /**
   * 认证服务实例
   */
  authService: DrizzleAuthService;

  /**
   * 可选的 Analytics 服务
   */
  analytics?: {
    track: (eventName: string, properties: any) => Promise<void>;
  };

  /**
   * CORS 配置
   */
  cors?: {
    enabled?: boolean;
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  };
}

/**
 * 登录路由配置
 */
export interface LoginRouteConfig extends BaseRouteConfig {
  /**
   * Cookie 配置
   */
  cookieOptions?: {
    name?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  };
}

/**
 * 注册路由配置
 */
export interface RegisterRouteConfig extends BaseRouteConfig {
  /**
   * 默认角色
   */
  defaultRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';

  /**
   * 是否需要邮箱验证
   */
  emailVerificationRequired?: boolean;

  /**
   * Cookie 配置
   */
  cookieOptions?: {
    name?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  };
}

/**
 * 标准 API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

