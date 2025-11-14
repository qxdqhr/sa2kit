/**
 * 通用导出服务 - PostgreSQL 数据库表结构定义
 *
 * 提供导出配置和历史记录的数据库表结构。
 *
 * 表结构概览：
 * - export_configs: 导出配置表
 * - export_history: 导出历史记录表
 *
 * 设计特点：
 * - 支持多种导出格式（CSV, Excel, JSON）
 * - 灵活的字段配置和分组
 * - 完整的历史记录追踪
 *
 * @fileoverview 数据库表结构 - 通用导出服务 (PostgreSQL)
 * @package sa2kit/universalExport/server
 */

import { pgTable, text, boolean, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

/**
 * 导出配置表 (ExportConfig)
 *
 * 存储导出任务的配置信息，包括字段选择、格式化、分组等。
 */
export const exportConfigs = pgTable('ExportConfig', {
  /** 主键ID */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `export_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),

  /** 配置名称 */
  name: text('name').notNull(),

  /** 配置描述 */
  description: text('description'),

  /** 导出格式：'csv' | 'excel' | 'json' */
  format: text('format').notNull(),

  /** 导出字段配置（JSON数组） */
  fields: jsonb('fields').notNull(), // ExportField[]

  /** 分组配置 */
  grouping: jsonb('grouping'), // GroupingConfig

  /** 文件名模板 */
  fileNameTemplate: text('fileNameTemplate').notNull(),

  /** 是否包含表头 */
  includeHeader: boolean('includeHeader').default(true).notNull(),

  /** 分隔符（用于CSV格式） */
  delimiter: text('delimiter').default(',').notNull(),

  /** 编码格式 */
  encoding: text('encoding').default('utf-8').notNull(),

  /** 是否添加BOM（用于Excel打开UTF-8 CSV） */
  addBOM: boolean('addBOM').default(true).notNull(),

  /** 最大导出行数 */
  maxRows: integer('maxRows'),

  /** 模块ID */
  moduleId: text('moduleId').notNull(),

  /** 业务ID */
  businessId: text('businessId'),

  /** 创建者ID */
  createdBy: text('createdBy'),

  /** 创建时间 */
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  /** 更新时间 */
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

/**
 * 导出历史记录表 (ExportHistory)
 *
 * 记录每次导出任务的执行情况，包括状态、耗时、文件信息等。
 */
export const exportHistory = pgTable('ExportHistory', {
  /** 主键ID */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `export_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),

  /** 关联的配置ID */
  configId: text('configId').notNull(),

  /** 导出的文件名 */
  fileName: text('fileName').notNull(),

  /** 文件大小（字节） */
  fileSize: integer('fileSize').notNull(),

  /** 导出的行数 */
  exportedRows: integer('exportedRows').notNull(),

  /** 导出状态：'pending' | 'processing' | 'completed' | 'failed' */
  status: text('status').notNull(),

  /** 错误信息（如果失败） */
  error: text('error'),

  /** 导出耗时（毫秒） */
  duration: integer('duration'),

  /** 开始时间 */
  startTime: timestamp('startTime', { precision: 3, mode: 'date' }).notNull(),

  /** 结束时间 */
  endTime: timestamp('endTime', { precision: 3, mode: 'date' }),

  /** 创建者ID */
  createdBy: text('createdBy'),

  /** 创建时间 */
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ========== 关系定义 ==========

/**
 * 导出配置表关系
 * 一个配置可以有多个导出历史记录
 */
export const exportConfigsRelations = relations(exportConfigs, ({ many }) => ({
  history: many(exportHistory),
}));

/**
 * 导出历史表关系
 * 每个历史记录关联一个配置
 */
export const exportHistoryRelations = relations(exportHistory, ({ one }) => ({
  config: one(exportConfigs, {
    fields: [exportHistory.configId],
    references: [exportConfigs.id],
  }),
}));

// ========== 导出类型 ==========

export type ExportConfig = typeof exportConfigs.$inferSelect;
export type NewExportConfig = typeof exportConfigs.$inferInsert;

export type ExportHistory = typeof exportHistory.$inferSelect;
export type NewExportHistory = typeof exportHistory.$inferInsert;

