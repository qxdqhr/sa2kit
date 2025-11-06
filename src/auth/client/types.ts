/**
 * Auth Client - Types
 * API 客户端类型定义
 */

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 用户类型
 */
export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  nickname?: string;
  avatar?: string;
  image?: string;
}

/**
 * 认证响应类型
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
} as const;

/**
 * API 路由
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
} as const;

