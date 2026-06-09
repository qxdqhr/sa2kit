/**
 * Auth Schema - Enums
 * 认证相关的枚举类型定义
 */

import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * 用户角色枚举
 */
export const userRole = pgEnum('UserRole', ['USER', 'ADMIN', 'SUPER_ADMIN']);

/**
 * 类型定义
 */
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

