/**
 * 配置管理模块 - Drizzle ORM Schema
 *
 * 包含4个核心表：
 * 1. system_configs - 系统配置值表
 * 2. config_metadata - 配置元数据表
 * 3. config_definitions - 配置定义表（ConfigEngine核心）
 * 4. config_history - 配置变更历史表
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * 系统配置值表
 * 存储实际的配置键值对
 */
export const systemConfigs = pgTable(
  'system_configs',
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    value: jsonb().notNull(),
    description: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  (table) => [
    uniqueIndex('system_configs_key_key').using(
      'btree',
      table.key.asc().nullsLast().op('text_ops')
    ),
  ]
);

/**
 * 配置元数据表
 * 存储配置的类型、类别和验证规则等元数据
 */
export const configMetadata = pgTable('config_metadata', {
  key: text().primaryKey().notNull(),
  category: text().notNull(),
  type: text().default('string').notNull(),
  isSensitive: boolean().default(false).notNull(),
  isRequired: boolean().default(false).notNull(),
  defaultDescription: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

/**
 * 配置定义表（ConfigEngine 核心）
 * 数据驱动的配置管理系统核心表
 */
export const configDefinitions = pgTable(
  'config_definitions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    key: text().notNull(),
    category: text().notNull(),
    name: text().notNull(),
    description: text(),

    // 类型和验证
    type: text().notNull(), // string, number, boolean, json, enum, url, email
    validationRules: jsonb(), // 验证规则 JSON

    // UI 配置
    uiComponent: text().default('input'), // input, textarea, select, switch, slider
    uiProps: jsonb(), // UI 组件属性

    // 安全和权限
    isSensitive: boolean().default(false).notNull(),
    isRequired: boolean().default(false).notNull(),
    isReadonly: boolean().default(false).notNull(),
    requiredPermission: text(),

    // 默认值和选项
    defaultValue: text(),
    enumOptions: jsonb(), // 枚举选项

    // 依赖和条件
    dependsOn: text().array(), // 依赖的配置项
    showIf: jsonb(), // 显示条件

    // 分组和排序
    groupName: text(),
    sortOrder: integer().default(0).notNull(),

    // 版本和状态
    version: integer().default(1).notNull(),
    status: text().default('active').notNull(), // active, deprecated, disabled

    // 标签
    tags: text().array(),

    // 元数据
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: integer(),
  },
  (table) => [
    uniqueIndex('config_definitions_key_key').using(
      'btree',
      table.key.asc().nullsLast().op('text_ops')
    ),
    index('config_definitions_category_idx').using(
      'btree',
      table.category.asc().nullsLast().op('text_ops')
    ),
    index('config_definitions_status_idx').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
  ]
);

/**
 * 配置变更历史表
 * 记录所有配置的变更历史，用于审计和回滚
 */
export const configHistory = pgTable(
  'config_history',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    configKey: text().notNull(),
    oldValue: text(),
    newValue: text(),
    changeType: text().notNull(), // create, update, delete
    changedBy: integer(),
    changedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    reason: text(),
    ipAddress: text(),
    userAgent: text(),
  },
  (table) => [
    index('config_history_key_idx').using(
      'btree',
      table.configKey.asc().nullsLast().op('text_ops')
    ),
    index('config_history_date_idx').using(
      'btree',
      table.changedAt.asc().nullsLast().op('timestamp_ops')
    ),
  ]
);

