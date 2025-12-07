/**
 * MMD 后台管理数据库表结构定义 (PostgreSQL)
 * 
 * 功能：
 * - 管理MMD播放列表配置
 * - 管理MMD播放节点
 * - 文件关联管理（与 universalFile 集成）
 * - 支持多种资源类型的映射
 * 
 * 设计原则：
 * - 与 universalFile 的 file_metadata 表无缝集成
 * - 支持文件ID到OSS URL的映射
 * - 保持数据结构灵活性，便于扩展
 * 
 * @package sa2kit/mmd/server
 */

import { relations } from 'drizzle-orm';
import {
  serial,
  text,
  timestamp,
  pgTable,
  json,
  integer,
  boolean,
  varchar,
  index,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * MMD播放列表表 (mmd_playlists)
 * 
 * 管理MMD播放列表的基础信息
 */
export const mmdPlaylists = pgTable(
  'mmd_playlists',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 播放列表名称 */
    name: varchar('name', { length: 255 }).notNull(),

    /** 播放列表描述 */
    description: text('description'),

    /** 是否启用列表循环 */
    loop: boolean('loop').notNull().default(false),

    /** 预加载策略: none, next, all */
    preloadStrategy: varchar('preload_strategy', { length: 20 }).notNull().default('none'),

    /** 是否自动播放 */
    autoPlay: boolean('auto_play').notNull().default(false),

    /** 播放列表缩略图文件ID (关联 file_metadata.id) */
    thumbnailFileId: uuid('thumbnail_file_id'),

    /** 播放列表状态: draft, published, archived */
    status: varchar('status', { length: 20 }).notNull().default('draft'),

    /** 显示顺序 */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 额外配置（JSON格式，存储舞台配置等） */
    config: json('config'),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    /** 删除时间（软删除） */
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    /** 按状态查询的索引 */
    statusIndex: index('mmd_playlists_status_idx').on(table.status),

    /** 按创建者查询的索引 */
    createdByIndex: index('mmd_playlists_created_by_idx').on(table.createdBy),

    /** 按删除状态查询的索引 */
    deletedAtIndex: index('mmd_playlists_deleted_at_idx').on(table.deletedAt),

    /** 按排序查询的索引 */
    sortOrderIndex: index('mmd_playlists_sort_order_idx').on(table.sortOrder),
  })
);

/**
 * MMD播放节点表 (mmd_playlist_nodes)
 * 
 * 管理播放列表中的每个播放节点
 */
export const mmdPlaylistNodes = pgTable(
  'mmd_playlist_nodes',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 所属播放列表ID */
    playlistId: uuid('playlist_id')
      .references(() => mmdPlaylists.id, { onDelete: 'cascade' })
      .notNull(),

    /** 节点名称 */
    name: varchar('name', { length: 255 }).notNull(),

    /** 节点描述 */
    description: text('description'),

    /** 是否启用节点循环 */
    loop: boolean('loop').notNull().default(false),

    /** 预计时长（秒） */
    duration: integer('duration'),

    /** 节点缩略图文件ID */
    thumbnailFileId: uuid('thumbnail_file_id'),

    /** 显示顺序 */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 模型文件ID (关联 file_metadata.id) */
    modelFileId: uuid('model_file_id').notNull(),

    /** 动作文件ID */
    motionFileId: uuid('motion_file_id'),

    /** 相机动画文件ID */
    cameraFileId: uuid('camera_file_id'),

    /** 音频文件ID */
    audioFileId: uuid('audio_file_id'),

    /** 舞台模型文件ID */
    stageModelFileId: uuid('stage_model_file_id'),

    /** 附加动作文件ID列表（JSON数组） */
    additionalMotionFileIds: json('additional_motion_file_ids').$type<string[]>(),

    /** 额外配置（JSON格式） */
    config: json('config'),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按播放列表查询的索引 */
    playlistIndex: index('mmd_playlist_nodes_playlist_idx').on(table.playlistId),

    /** 按排序查询的索引 */
    sortOrderIndex: index('mmd_playlist_nodes_sort_order_idx').on(table.sortOrder),

    /** 按模型文件查询的索引 */
    modelFileIndex: index('mmd_playlist_nodes_model_file_idx').on(table.modelFileId),

    /** 组合索引：播放列表+排序 */
    playlistSortIndex: index('mmd_playlist_nodes_playlist_sort_idx').on(
      table.playlistId,
      table.sortOrder
    ),
  })
);

/**
 * MMD资源选项表 (mmd_resource_options)
 * 
 * 管理可选的MMD资源（用于自由组合模式）
 */
export const mmdResourceOptions = pgTable(
  'mmd_resource_options',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 资源名称 */
    name: varchar('name', { length: 255 }).notNull(),

    /** 资源描述 */
    description: text('description'),

    /** 资源类型: model, motion, camera, audio, stage */
    resourceType: varchar('resource_type', { length: 20 }).notNull(),

    /** 文件ID (关联 file_metadata.id) */
    fileId: uuid('file_id').notNull(),

    /** 缩略图文件ID */
    thumbnailFileId: uuid('thumbnail_file_id'),

    /** 资源标签（JSON数组，用于分类和筛选） */
    tags: json('tags').$type<string[]>(),

    /** 显示顺序 */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按资源类型查询的索引 */
    resourceTypeIndex: index('mmd_resource_options_resource_type_idx').on(table.resourceType),

    /** 按文件ID查询的索引 */
    fileIdIndex: index('mmd_resource_options_file_id_idx').on(table.fileId),

    /** 按活跃状态查询的索引 */
    isActiveIndex: index('mmd_resource_options_is_active_idx').on(table.isActive),

    /** 按创建者查询的索引 */
    createdByIndex: index('mmd_resource_options_created_by_idx').on(table.createdBy),

    /** 组合索引：资源类型+活跃状态+排序 */
    typeActiveSortIndex: index('mmd_resource_options_type_active_sort_idx').on(
      table.resourceType,
      table.isActive,
      table.sortOrder
    ),
  })
);

/**
 * MMD预设列表项表 (mmd_preset_items)
 * 
 * 管理预设的MMD资源组合（用于列表模式）
 */
export const mmdPresetItems = pgTable(
  'mmd_preset_items',
  {
    /** 主键ID */
    id: uuid('id').primaryKey().defaultRandom(),

    /** 预设名称 */
    name: varchar('name', { length: 255 }).notNull(),

    /** 预设描述 */
    description: text('description'),

    /** 缩略图文件ID */
    thumbnailFileId: uuid('thumbnail_file_id'),

    /** 模型文件ID */
    modelFileId: uuid('model_file_id').notNull(),

    /** 动作文件ID */
    motionFileId: uuid('motion_file_id'),

    /** 相机动画文件ID */
    cameraFileId: uuid('camera_file_id'),

    /** 音频文件ID */
    audioFileId: uuid('audio_file_id'),

    /** 舞台模型文件ID */
    stageModelFileId: uuid('stage_model_file_id'),

    /** 附加动作文件ID列表（JSON数组） */
    additionalMotionFileIds: json('additional_motion_file_ids').$type<string[]>(),

    /** 显示顺序 */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),

    /** 预设标签（JSON数组） */
    tags: json('tags').$type<string[]>(),

    /** 创建者ID */
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    /** 创建时间 */
    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** 按活跃状态查询的索引 */
    isActiveIndex: index('mmd_preset_items_is_active_idx').on(table.isActive),

    /** 按排序查询的索引 */
    sortOrderIndex: index('mmd_preset_items_sort_order_idx').on(table.sortOrder),

    /** 按创建者查询的索引 */
    createdByIndex: index('mmd_preset_items_created_by_idx').on(table.createdBy),

    /** 按模型文件查询的索引 */
    modelFileIndex: index('mmd_preset_items_model_file_idx').on(table.modelFileId),
  })
);

// ========== 关系定义 ==========

export const mmdPlaylistsRelations = relations(mmdPlaylists, ({ many }) => ({
  nodes: many(mmdPlaylistNodes),
}));

export const mmdPlaylistNodesRelations = relations(mmdPlaylistNodes, ({ one }) => ({
  playlist: one(mmdPlaylists, {
    fields: [mmdPlaylistNodes.playlistId],
    references: [mmdPlaylists.id],
  }),
}));

// ========== 导出类型 ==========

export type MmdPlaylist = typeof mmdPlaylists.$inferSelect;
export type NewMmdPlaylist = typeof mmdPlaylists.$inferInsert;

export type MmdPlaylistNode = typeof mmdPlaylistNodes.$inferSelect;
export type NewMmdPlaylistNode = typeof mmdPlaylistNodes.$inferInsert;

export type MmdResourceOption = typeof mmdResourceOptions.$inferSelect;
export type NewMmdResourceOption = typeof mmdResourceOptions.$inferInsert;

export type MmdPresetItem = typeof mmdPresetItems.$inferSelect;
export type NewMmdPresetItem = typeof mmdPresetItems.$inferInsert;
