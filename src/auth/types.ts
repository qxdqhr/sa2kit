/**
 * Auth 模块类型定义
 */

/**
 * 用户基础信息
 */
export interface User {
  id: string;
  email: string;
  username: string;
  [key: string]: any;
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
 * 登录表单数据接口
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * 注册表单数据接口
 */
export interface RegisterFormData {
  email: string;
  password: string;
  username: string;
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

