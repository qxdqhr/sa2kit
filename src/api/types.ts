/**
 * API 通用类型定义
 * Common API Types
 */

/**
 * API 响应类型
 * Generic API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    [key: string]: any;
  };
}

/**
 * 分页参数类型
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 认证响应类型（泛型）
 * Generic Auth Response
 */
export interface AuthResponse<TUser = any> {
  user: TUser;
  token: string;
}

/**
 * 默认存储键常量
 * Default Storage Keys
 */
export const DEFAULT_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * 存储键类型（可扩展）
 * Storage Keys Type
 */
export type StorageKeys = typeof DEFAULT_STORAGE_KEYS;

/**
 * API 路由配置
 * API Routes Configuration
 */
export interface ApiRoutes {
  /** 认证相关路由 */
  auth?: {
    login?: string;
    logout?: string;
    register?: string;
    me?: string;
  };
  /** 用户相关路由 */
  users?: {
    list?: string;
    detail?: (id: string) => string;
    update?: (id: string) => string;
    delete?: (id: string) => string;
  };
  /** 自定义路由 */
  [key: string]: any;
}

/**
 * 默认 API 路由
 */
export const DEFAULT_API_ROUTES: ApiRoutes = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    me: '/auth/me',
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
};
