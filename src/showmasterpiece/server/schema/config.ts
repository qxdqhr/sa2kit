/**
 * ShowMasterpiece模块 - 配置管理数据库表结构
 * 
 * 独立的配置管理表，不依赖全局配置表
 * 用于模块独立化部署
 */

import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * ShowMasterPieces配置分类表
 * 表名：showmaster_config_categories
 */
export const showmasterConfigCategories = pgTable('showmaster_config_categories', {
  /** 配置分类ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  /** 分类名称（用于代码引用） */
  name: text('name').notNull(),
  
  /** 显示名称（用于界面显示） */
  displayName: text('display_name').notNull(),
  
  /** 分类描述 */
  description: text('description'),
  
  /** 分类图标 */
  icon: text('icon'),
  
  /** 排序顺序 */
  sortOrder: integer('sort_order').default(0),
  
  /** 是否激活 */
  isActive: boolean('is_active').default(true),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ShowMasterPieces配置项表
 * 表名：showmaster_config_items
 */
export const showmasterConfigItems = pgTable('showmaster_config_items', {
  /** 配置项ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  /** 分类ID */
  categoryId: text('category_id').references(() => showmasterConfigCategories.id),
  
  /** 配置键（必须唯一） */
  key: text('key').notNull().unique(),
  
  /** 显示名称 */
  displayName: text('display_name').notNull(),
  
  /** 配置描述 */
  description: text('description'),
  
  /** 配置值 */
  value: text('value'),
  
  /** 默认值 */
  defaultValue: text('default_value'),
  
  /** 配置类型：string, number, boolean, json, password */
  type: text('type').notNull(),
  
  /** 是否必填 */
  isRequired: boolean('is_required').default(false),
  
  /** 是否敏感信息 */
  isSensitive: boolean('is_sensitive').default(false),
  
  /** 验证规则（JSON格式） */
  validation: jsonb('validation'),
  
  /** 排序顺序 */
  sortOrder: integer('sort_order').default(0),
  
  /** 是否激活 */
  isActive: boolean('is_active').default(true),
  
  /** 环境标识（development, production, testing等） */
  environment: text('environment').default('development'),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ShowMasterPieces配置历史表
 * 表名：showmaster_config_history
 */
export const showmasterConfigHistory = pgTable('showmaster_config_history', {
  /** 历史记录ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  /** 配置项ID */
  configItemId: text('config_item_id').references(() => showmasterConfigItems.id),
  
  /** 旧值 */
  oldValue: text('old_value'),
  
  /** 新值 */
  newValue: text('new_value'),
  
  /** 修改人 */
  changedBy: text('changed_by').notNull(),
  
  /** 修改原因 */
  changeReason: text('change_reason'),
  
  /** 操作类型：create, update, delete */
  operationType: text('operation_type').notNull(),
  
  /** 环境标识 */
  environment: text('environment').default('development'),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ShowMasterPieces配置权限表（可选，用于细粒度权限控制）
 * 表名：showmaster_config_permissions
 */
export const showmasterConfigPermissions = pgTable('showmaster_config_permissions', {
  /** 权限ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  /** 用户ID */
  userId: text('user_id').notNull(),
  
  /** 分类ID */
  categoryId: text('category_id').references(() => showmasterConfigCategories.id),
  
  /** 可读权限 */
  canRead: boolean('can_read').default(true),
  
  /** 可写权限 */
  canWrite: boolean('can_write').default(false),
  
  /** 可删除权限 */
  canDelete: boolean('can_delete').default(false),
  
  /** 环境权限（可以访问的环境） */
  allowedEnvironments: jsonb('allowed_environments').$type<string[]>().default(['development']),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 导出类型定义
export type ShowmasterConfigCategory = typeof showmasterConfigCategories.$inferSelect;
export type NewShowmasterConfigCategory = typeof showmasterConfigCategories.$inferInsert;

export type ShowmasterConfigItem = typeof showmasterConfigItems.$inferSelect;
export type NewShowmasterConfigItem = typeof showmasterConfigItems.$inferInsert;

export type ShowmasterConfigHistory = typeof showmasterConfigHistory.$inferSelect;
export type NewShowmasterConfigHistory = typeof showmasterConfigHistory.$inferInsert;

export type ShowmasterConfigPermission = typeof showmasterConfigPermissions.$inferSelect;
export type NewShowmasterConfigPermission = typeof showmasterConfigPermissions.$inferInsert;
