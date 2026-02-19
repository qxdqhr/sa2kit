import type { User } from '../types';

/**
 * 验证手机号格式
 */
export function validatePhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证密码强度（可扩展）
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少6位' };
  }
  
  return { valid: true };
}

/**
 * 生成安全的会话令牌
 */
export function generateSessionToken(): string {
  // 在实际环境中，应该使用更安全的随机数生成
  return Math.random().toString(36).substring(2) + 
         Date.now().toString(36) + 
         Math.random().toString(36).substring(2);
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * 检查用户是否处于活跃状态
 */
export function isActiveUser(user: User | null): boolean {
  return user?.isActive === true;
}

/**
 * 格式化用户显示名称
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.phone || '未知用户';
}

/**
 * 计算会话过期时间
 */
export function calculateSessionExpiry(days: number = 30): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * 检查会话是否过期
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
} 