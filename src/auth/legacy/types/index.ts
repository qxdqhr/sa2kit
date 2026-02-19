// ===== 用户相关类型 =====

/**
 * 用户信息接口
 */
export interface User {
  id: number;
  phone: string;
  name?: string | null;
  email?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户会话接口
 */
export interface UserSession {
  id: number;
  userId: number;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

// ===== 请求/响应类型 =====

/**
 * 登录请求接口
 */
export interface LoginRequest {
  phone: string;
  password: string;
}

/**
 * 注册请求接口
 */
export interface RegisterRequest {
  phone: string;
  password: string;
  name?: string;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}

/**
 * 注册响应接口
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}

/**
 * 会话验证响应接口
 */
export interface SessionValidationResponse {
  valid: boolean;
  user?: User;
  message?: string;
}

/**
 * 会话验证结果接口
 */
export interface SessionValidation {
  valid: boolean;
  user?: User;
}

// ===== 组件Props类型 =====

/**
 * 登录模态框Props
 */
export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister?: () => void;
}

/**
 * 注册模态框Props
 */
export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin?: () => void;
}

/**
 * 认证守卫Props
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 自定义菜单项接口
 */
export interface CustomMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  requireAuth?: boolean; // 是否需要登录才显示
}

/**
 * 用户菜单Props
 */
export interface UserMenuProps {
  customMenuItems?: CustomMenuItem[]; // 自定义菜单项
  className?: string; // 自定义样式类名
}

/**
 * 忘记密码模态框Props
 */
export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ===== Hook返回类型 =====

/**
 * useAuth Hook返回值类型
 */
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

// ===== 服务相关类型 =====

/**
 * 认证服务接口
 */
export interface AuthService {
  verifyPassword(phone: string, password: string): Promise<User | null>;
  createUser(phone: string, password: string, name?: string): Promise<User>;
  createSession(userId: number): Promise<UserSession>;
  validateSession(sessionToken: string): Promise<SessionValidation>;
  deleteSession(sessionToken: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  getUserByPhone(phone: string): Promise<User | null>;
  sendVerificationCode(phone: string): Promise<string>;
  verifyCode(phone: string, code: string): Promise<boolean>;
  resetPassword(phone: string, newPassword: string): Promise<void>;
  cleanupExpiredVerificationCodes(): Promise<void>;
}

// ===== 工具函数类型 =====

/**
 * API权限验证函数类型
 */
export type ValidateApiAuth = (request: Request) => Promise<User | null>;

// ===== 常量类型 =====

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * 会话配置
 */
export interface SessionConfig {
  maxAge: number; // 会话最大存活时间（秒）
  cookieName: string; // Cookie名称
  secure: boolean; // 是否使用安全Cookie
  httpOnly: boolean; // 是否仅HTTP访问
  sameSite: 'strict' | 'lax' | 'none'; // SameSite策略
} 