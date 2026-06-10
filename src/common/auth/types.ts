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

// ==================== 重新导出枚举类型 ====================
export type { UserRole } from './schema/enums';
