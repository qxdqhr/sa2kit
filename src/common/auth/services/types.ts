/**
 * Auth Services - Types
 * 认证服务类型定义
 */

import type { UserRole } from '../schema/enums';

/**
 * 认证服务配置
 */
export interface AuthServiceConfig {
  /**
   * Drizzle 数据库实例
   */
  db: any;

  /**
   * JWT 密钥
   */
  jwtSecret: string;

  /**
   * JWT 过期时间 (默认: '7d')
   */
  jwtExpiresIn?: string;

  /**
   * bcrypt 加密轮数 (默认: 12)
   */
  saltRounds?: number;

  /**
   * 是否在生产环境检查密钥强度 (默认: true)
   */
  checkSecretStrength?: boolean;
}

/**
 * 用户信息（返回给客户端的精简版）
 */
export interface UserInfo {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

/**
 * 认证结果
 */
export interface AuthResult {
  user: UserInfo;
  token: string;
}

/**
 * 会话信息
 */
export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * 验证结果
 */
export interface VerifyResult {
  user: UserInfo;
  session: SessionInfo;
}

