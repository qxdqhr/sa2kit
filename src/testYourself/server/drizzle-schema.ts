/**
 * TestYourself 模块数据库表结构定义
 * Database Schema for TestYourself Module
 * 
 * 使用 Drizzle ORM 定义配置表
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  json,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import type { TestConfig } from '../types';

/**
 * 测试配置表 (test_yourself_configs)
 * 
 * 存储所有测试配置，支持多租户、版本控制等企业级功能
 */
export const testYourselfConfigs = pgTable(
  'test_yourself_configs',
  {
    // ========== 主键 ==========
    /** 配置唯一ID */
    id: uuid('id').primaryKey().defaultRandom(),

    // ========== 基本信息 ==========
    /** 配置名称 */
    name: varchar('name', { length: 255 }).notNull(),
    
    /** 配置描述 */
    description: text('description'),
    
    /** 配置标签（用于分类和搜索） */
    tags: json('tags').$type<string[]>().default([]),

    // ========== 配置数据 ==========
    /** 测试配置内容（JSON格式） */
    config: json('config').$type<TestConfig>().notNull(),
    
    /** 结果数量（冗余字段，便于查询） */
    resultCount: integer('result_count').notNull().default(0),

    // ========== 状态字段 ==========
    /** 是否为默认配置 */
    isDefault: boolean('is_default').notNull().default(false),
    
    /** 是否已发布（草稿/发布） */
    isPublished: boolean('is_published').notNull().default(true),
    
    /** 是否已归档 */
    isArchived: boolean('is_archived').notNull().default(false),
    
    /** 是否已删除（软删除） */
    isDeleted: boolean('is_deleted').notNull().default(false),

    // ========== 权限和所有权 ==========
    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    
    /** 最后更新者ID */
    updatedBy: varchar('updated_by', { length: 255 }),
    
    /** 所属组织/租户ID（多租户支持） */
    organizationId: varchar('organization_id', { length: 255 }),

    // ========== 统计信息 ==========
    /** 使用次数 */
    usageCount: integer('usage_count').notNull().default(0),
    
    /** 最后使用时间 */
    lastUsedAt: timestamp('last_used_at'),
    
    /** 浏览次数 */
    viewCount: integer('view_count').notNull().default(0),

    // ========== 版本控制 ==========
    /** 配置版本号 */
    version: integer('version').notNull().default(1),
    
    /** 父配置ID（用于版本追踪） */
    parentId: uuid('parent_id'),

    // ========== 自定义字段 ==========
    /** 自定义元数据（扩展字段） */
    metadata: json('metadata').$type<Record<string, any>>(),
    
    /** 配置来源（web/api/import） */
    source: varchar('source', { length: 50 }),

    // ========== 时间戳 ==========
    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),
    
    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    
    /** 发布时间 */
    publishedAt: timestamp('published_at'),
    
    /** 归档时间 */
    archivedAt: timestamp('archived_at'),
    
    /** 删除时间 */
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    // ========== 索引设计 ==========
    
    /** 名称搜索索引 */
    nameIndex: index('test_configs_name_idx').on(table.name),
    
    /** 创建者索引 */
    createdByIndex: index('test_configs_created_by_idx').on(table.createdBy),
    
    /** 组织索引（多租户） */
    organizationIndex: index('test_configs_organization_idx').on(table.organizationId),
    
    /** 默认配置索引 */
    isDefaultIndex: index('test_configs_is_default_idx').on(table.isDefault),
    
    /** 发布状态索引 */
    isPublishedIndex: index('test_configs_is_published_idx').on(table.isPublished),
    
    /** 删除状态索引 */
    isDeletedIndex: index('test_configs_is_deleted_idx').on(table.isDeleted),
    
    /** 创建时间索引 */
    createdAtIndex: index('test_configs_created_at_idx').on(table.createdAt),
    
    /** 最后使用时间索引 */
    lastUsedAtIndex: index('test_configs_last_used_at_idx').on(table.lastUsedAt),
    
    /** 组合索引：组织+删除状态+发布状态 */
    orgDeletedPublishedIndex: index('test_configs_org_deleted_published_idx').on(
      table.organizationId,
      table.isDeleted,
      table.isPublished
    ),
    
    /** 组合索引：创建者+删除状态 */
    createdByDeletedIndex: index('test_configs_created_by_deleted_idx').on(
      table.createdBy,
      table.isDeleted
    ),
  })
);

/**
 * 配置使用记录表 (test_yourself_config_usage)
 * 
 * 记录配置的每次使用情况，用于统计分析
 */
export const testYourselfConfigUsage = pgTable(
  'test_yourself_config_usage',
  {
    /** 记录ID */
    id: uuid('id').primaryKey().defaultRandom(),
    
    /** 配置ID */
    configId: uuid('config_id')
      .references(() => testYourselfConfigs.id, { onDelete: 'cascade' })
      .notNull(),
    
    /** 用户ID */
    userId: varchar('user_id', { length: 255 }),
    
    /** 设备指纹 */
    fingerprint: text('fingerprint'),
    
    /** 测试结果ID */
    resultId: varchar('result_id', { length: 255 }),
    
    /** IP地址 */
    ipAddress: varchar('ip_address', { length: 45 }),
    
    /** User Agent */
    userAgent: text('user_agent'),
    
    /** 来源页面 */
    referer: text('referer'),
    
    /** 使用时间 */
    usedAt: timestamp('used_at').defaultNow().notNull(),
    
    /** 完成时间（毫秒） */
    completionTime: integer('completion_time'),
    
    /** 额外数据 */
    metadata: json('metadata').$type<Record<string, any>>(),
  },
  (table) => ({
    /** 配置ID索引 */
    configIndex: index('test_usage_config_idx').on(table.configId),
    
    /** 用户ID索引 */
    userIndex: index('test_usage_user_idx').on(table.userId),
    
    /** 使用时间索引 */
    usedAtIndex: index('test_usage_used_at_idx').on(table.usedAt),
    
    /** 指纹索引 */
    fingerprintIndex: index('test_usage_fingerprint_idx').on(table.fingerprint),
  })
);

/**
 * 配置分享表 (test_yourself_config_shares)
 * 
 * 管理配置的公开分享功能
 */
export const testYourselfConfigShares = pgTable(
  'test_yourself_config_shares',
  {
    /** 分享ID */
    id: uuid('id').primaryKey().defaultRandom(),
    
    /** 分享代码（短链接标识） */
    shareCode: varchar('share_code', { length: 20 }).notNull().unique(),
    
    /** 配置ID */
    configId: uuid('config_id')
      .references(() => testYourselfConfigs.id, { onDelete: 'cascade' })
      .notNull(),
    
    /** 分享标题 */
    title: varchar('title', { length: 255 }),
    
    /** 分享描述 */
    description: text('description'),
    
    /** 访问密码 */
    password: varchar('password', { length: 100 }),
    
    /** 最大访问次数 */
    maxAccess: integer('max_access'),
    
    /** 当前访问次数 */
    accessCount: integer('access_count').notNull().default(0),
    
    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),
    
    /** 过期时间 */
    expiresAt: timestamp('expires_at'),
    
    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    
    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),
    
    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 分享代码索引 */
    shareCodeIndex: index('test_shares_share_code_idx').on(table.shareCode),
    
    /** 配置ID索引 */
    configIndex: index('test_shares_config_idx').on(table.configId),
    
    /** 创建者索引 */
    createdByIndex: index('test_shares_created_by_idx').on(table.createdBy),
    
    /** 活跃状态索引 */
    isActiveIndex: index('test_shares_is_active_idx').on(table.isActive),
  })
);

// ========== 类型导出 ==========

export type TestYourselfConfig = typeof testYourselfConfigs.$inferSelect;
export type NewTestYourselfConfig = typeof testYourselfConfigs.$inferInsert;

export type TestYourselfConfigUsage = typeof testYourselfConfigUsage.$inferSelect;
export type NewTestYourselfConfigUsage = typeof testYourselfConfigUsage.$inferInsert;

export type TestYourselfConfigShare = typeof testYourselfConfigShares.$inferSelect;
export type NewTestYourselfConfigShare = typeof testYourselfConfigShares.$inferInsert;
