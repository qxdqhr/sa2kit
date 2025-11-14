/**
 * Auth 模块类型定义
 * Auth Module Types
 */

import type { UserRole } from './schema/enums';

/**
 * 用户基础信息（核心字段）
 * Base User Information
 */
export interface BaseUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

/**
 * 扩展用户信息（可选字段）
 * Extended User Information
 */
export interface User extends BaseUser {
  nickname?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // 允许项目添加自定义字段
}

/**
 * 登录表单数据
 * Login Form Data
 */
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 注册表单数据
 * Register Form Data
 */
export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
}

/**
 * API 客户端基础接口
 */
export interface BaseApiClient {
  isAuthenticated(): Promise<boolean>;
  getCurrentUser(): Promise<{ success: boolean; data?: User; error?: string }>;
  login(email: string, password: string): Promise<{ success: boolean; data?: { user: User }; error?: string }>;
  register(email: string, password: string, username: string): Promise<{ success: boolean; data?: { user: User }; error?: string }>;
  logout(): Promise<void>;
  clearUserData(): Promise<void>;
}

/**
 * 认证操作结果接口
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * useAuth Hook 返回值接口
 */
export interface UseAuthReturn {
  // 状态
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  checkingAuth: boolean;
  error: string | null;

  // 操作方法
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, username: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ==================== 重新导出枚举类型 ====================
export type { UserRole } from './schema/enums';
