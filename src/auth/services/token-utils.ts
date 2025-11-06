/**
 * Auth Services - Token Utilities
 * Token 相关工具函数
 */

import jwt from 'jsonwebtoken';
import type { UserRole } from '../schema/enums';

/**
 * JWT Payload
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * 生成 JWT Token
 */
export function generateToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string | number = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证 JWT Token
 */
export function verifyJwtToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}

/**
 * 从请求中获取 Token
 * 优先从 Cookie 读取（Web），兼容 Authorization Header（Mobile/API）
 */
export function getTokenFromRequest(request: Request): string | null {
  // 🔐 优先从 httpOnly Cookie 读取（Web 管理后台，更安全）
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    // 匹配 auth_token
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 🔄 兼容从 Authorization Header 读取（移动端、小程序、API 调用）
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token || null;
  }

  return null;
}

