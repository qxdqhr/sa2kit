/**
 * Auth Client - Types
 * API 客户端类型定义
 */

import type { UserRole, User, ApiResponse, AuthResponse } from '../types';

export type { UserRole, User, ApiResponse, AuthResponse };

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

