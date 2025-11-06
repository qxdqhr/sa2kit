/**
 * Auth Services - Password Utilities
 * 密码哈希相关工具函数
 */

import bcrypt from 'bcryptjs';

/**
 * 哈希密码
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

