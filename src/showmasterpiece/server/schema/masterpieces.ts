/**
 * ShowMasterpiece 模块 - 数据库表结构定义
 * 
 * 这个文件定义了ShowMasterpiece模块的完整数据库表结构，使用Drizzle ORM框架。
 * 包含了所有相关的表定义、索引优化和关系映射。
 * 
 * 表结构概览：
 * - comicUniverseConfigs: 系统配置表
 * - comicUniverseCategories: 画集分类表 
 * - comicUniverseTags: 标签表
 * - comicUniverseCollections: 画集主表
 * - comicUniverseCollectionTags: 画集标签关联表（多对多）
 * - comicUniverseArtworks: 作品页面表
 * 
 * 设计特点：
 * - 完整的外键约束和级联删除
 * - 针对查询场景的索引优化
 * - 支持软删除和发布状态控制
 * - 灵活的分类和标签系统
 * 
 * @fileoverview 数据库表结构 - ShowMasterpiece模块
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
  uuid,
  index
} from 'drizzle-orm/pg-core';

/**
 * 系统配置表 (comic_universe_configs)
 * 
 * 存储ShowMasterpiece模块的全局配置信息，包括网站设置、显示选项等。
 * 通常只有一条记录，用于控制整个模块的行为和外观。
 * 
 * 主要功能：
 * - 网站标题和描述配置
 * - 显示选项和分页设置
 * - 主题和语言设置
 * - 功能开关控制
 */
export const comicUniverseConfigs = pgTable('comic_universe_configs', {
  /** 主键ID */
  id: serial('id').primaryKey(),
  
  /** 网站名称 */
  siteName: varchar('site_name', { length: 255 }).notNull().default('画集展览'),
  
  /** 网站描述 */
  siteDescription: text('site_description').default('精美的艺术作品展览'),
  
  /** 首页主标题 */
  heroTitle: varchar('hero_title', { length: 255 }).notNull().default('艺术画集展览'),
  
  /** 首页副标题 */
  heroSubtitle: text('hero_subtitle').default('探索精美的艺术作品，感受创作的魅力'),
  
  /** 每页显示的最大画集数量 */
  maxCollectionsPerPage: integer('max_collections_per_page').notNull().default(9),
  
  /** 是否启用搜索功能 */
  enableSearch: boolean('enable_search').notNull().default(true),
  
  /** 是否启用分类功能 */
  enableCategories: boolean('enable_categories').notNull().default(true),

  /** 首页分类Tab配置 */
  homeTabConfig: json('home_tab_config').default([]),
  
  /** 默认分类（'all'表示显示所有分类） */
  defaultCategory: varchar('default_category', { length: 100 }).notNull().default('all'),
  
  /** 主题模式：light(浅色)、dark(深色)、auto(自动) */
  theme: varchar('theme', { length: 20 }).notNull().default('light'),
  
  /** 界面语言：zh(中文)、en(英文) */
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 画集分类表 (comic_universe_categories)
 * 
 * 管理画集的分类信息，支持层级结构和排序。
 * 用于组织和筛选画集，提供更好的浏览体验。
 * 
 * 主要功能：
 * - 分类名称和描述管理
 * - 显示顺序控制
 * - 启用/禁用状态控制
 * - 支持未来的层级分类扩展
 */
export const comicUniverseCategories = pgTable('comic_universe_categories', {
  /** 主键ID */
  id: serial('id').primaryKey(),
  
  /** 分类名称（唯一） */
  name: varchar('name', { length: 100 }).notNull().unique(),
  
  /** 分类描述 */
  description: text('description'),
  
  /** 显示顺序（数字越小越靠前） */
  displayOrder: integer('display_order').default(0),
  
  /** 是否启用该分类 */
  isActive: boolean('is_active').notNull().default(true),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  /** 按启用状态查询的索引 */
  isActiveIndex: index('categories_is_active_idx').on(table.isActive),
  
  /** 按显示顺序排序的索引 */
  displayOrderIndex: index('categories_display_order_idx').on(table.displayOrder),
  
}));

/**
 * 标签表 (comic_universe_tags)
 * 
 * 管理画集的标签信息，支持颜色标识和状态控制。
 * 通过多对多关系与画集关联，实现灵活的标签系统。
 * 
 * 主要功能：
 * - 标签名称管理（唯一性约束）
 * - 颜色标识（用于UI显示）
 * - 启用/禁用状态控制
 * - 支持标签的增删改查
 */
export const comicUniverseTags = pgTable('comic_universe_tags', {
  /** 主键ID */
  id: serial('id').primaryKey(),
  
  /** 标签名称（唯一） */
  name: varchar('name', { length: 50 }).notNull().unique(),
  
  /** 标签颜色（十六进制色值，用于UI显示） */
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  
  /** 是否启用该标签 */
  isActive: boolean('is_active').notNull().default(true),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  /** 按启用状态查询的索引 */
  isActiveIndex: index('tags_is_active_idx').on(table.isActive),
  
}));

/**
 * 画集主表 (comic_universe_collections)
 * 
 * 存储画集的基本信息和元数据，是系统的核心表之一。
 * 每个画集包含多个作品页面，支持分类、发布状态和访问统计。
 * 
 * 主要功能：
 * - 画集基本信息（标题、作者、封面、描述）
 * - 分类关联（外键引用）
 * - 发布状态和时间控制
 * - 显示顺序和访问统计
 * - 支持软删除和草稿功能
 */
export const comicUniverseCollections = pgTable('comic_universe_collections', {
  /** 主键ID */
  id: serial('id').primaryKey(),
  
  /** 画集标题 */
  title: varchar('title', { length: 255 }).notNull(),
  
  /** 编号 */
  number: varchar('number', { length: 255 }).notNull(),
  
  /** 封面图片（支持URL或base64编码） */
  coverImage: text('cover_image').notNull(),
  
  /** 通用文件服务的封面图片文件ID（新架构） */
  coverImageFileId: uuid('cover_image_file_id'),
  
  /** 画集描述 */
  description: text('description'),
  
  /** 分类ID（外键，支持级联删除时设为null） */
  categoryId: integer('category_id').references(() => comicUniverseCategories.id, { onDelete: 'set null' }),
  
  /** 是否已发布（false表示草稿状态） */
  isPublished: boolean('is_published').notNull().default(true),
  
  /** 发布时间 */
  publishedAt: timestamp('published_at'),
  
  /** 显示顺序（数字越小越靠前） */
  displayOrder: integer('display_order').default(0),
  
  /** 画集价格（单位：元，null表示免费或价格待定） */
  price: integer('price'),
  
  /** 访问次数统计 */
  viewCount: integer('view_count').notNull().default(0),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  /** 按发布状态查询的索引 */
  isPublishedIndex: index('collections_is_published_idx').on(table.isPublished),
  
  /** 按显示顺序排序的索引 */
  displayOrderIndex: index('collections_display_order_idx').on(table.displayOrder),
  
  /** 按分类查询的索引 */
  categoryIdIndex: index('collections_category_id_idx').on(table.categoryId),
  
  /** 已发布画集按顺序排序的复合索引（优化首页查询） */
  publishedOrderIndex: index('collections_published_order_idx').on(table.isPublished, table.displayOrder),
  
  /** 已发布画集按创建时间排序的复合索引（优化时间线查询） */
  publishedCreatedIndex: index('collections_published_created_idx').on(table.isPublished, table.createdAt),
  
  /** 封面图片文件ID查询索引（新架构） */
  coverImageFileIdIndex: index('collections_cover_image_file_id_idx').on(table.coverImageFileId),
}));

/**
 * 画集标签关联表 (comic_universe_collection_tags)
 * 
 * 实现画集和标签之间的多对多关系。
 * 每个画集可以有多个标签，每个标签也可以关联多个画集。
 * 
 * 主要功能：
 * - 画集与标签的多对多关联
 * - 支持级联删除（删除画集或标签时自动清理关联）
 * - 复合主键确保关联的唯一性
 * - 针对查询场景的索引优化
 */
export const comicUniverseCollectionTags = pgTable('comic_universe_collection_tags', {
  /** 画集ID（外键，级联删除） */
  collectionId: integer('collection_id').notNull().references(() => comicUniverseCollections.id, { onDelete: 'cascade' }),
  
  /** 标签ID（外键，级联删除） */
  tagId: integer('tag_id').notNull().references(() => comicUniverseTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  /** 复合主键，确保同一画集不会重复关联同一标签 */
  pk: { primaryKey: [table.collectionId, table.tagId] },
  
  /** 按画集查询标签的索引 */
  collectionIdIndex: index('collection_tags_collection_id_idx').on(table.collectionId),
  
  /** 按标签查询画集的索引 */
  tagIdIndex: index('collection_tags_tag_id_idx').on(table.tagId),
}));

/**
 * 作品页面表 (comic_universe_artworks)
 * 
 * 存储画集中的具体作品信息，每个画集包含多个作品页面。
 * 支持详细的作品元数据和页面排序功能。
 * 
 * 主要功能：
 * - 作品详细信息（标题、作者、图片、描述等）
 * - 艺术作品元数据（创作时间、主题、尺寸等）
 * - 在画集中的页面顺序控制
 * - 启用/禁用状态（软删除）
 * - 支持富文本描述和多媒体内容
 */
export const comicUniverseArtworks = pgTable('comic_universe_artworks', {
  /** 主键ID */
  id: serial('id').primaryKey(),
  
  /** 所属画集ID（外键，级联删除） */
  collectionId: integer('collection_id').notNull().references(() => comicUniverseCollections.id, { onDelete: 'cascade' }),
  
  /** 作品标题 */
  title: varchar('title', { length: 255 }).notNull(),
  
  /** 编号 */
  number: varchar('number', { length: 255 }).notNull(),
  
  /** 作品图片（支持URL或base64编码，兼容旧数据） */
  image: text('image'),
  
  /** 通用文件服务的文件ID（新架构） */
  fileId: uuid('file_id'),
  
  /** 迁移状态：pending(待迁移), completed(已完成), failed(失败) */
  migrationStatus: varchar('migration_status', { length: 20 }).default('pending'),
  
  /** 作品描述 */
  description: text('description'),
  
  /** 创作时间（自由格式，如"2024年春" "明代" 等） */
  createdTime: varchar('created_time', { length: 20 }),
  
  /** 作品主题（如"山水" "人物" "静物"等） */
  theme: varchar('theme', { length: 255 }),
  
  /** 作品尺寸（如"120x80cm" "A4" 等） */
  dimensions: varchar('dimensions', { length: 100 }),
  
  /** 在画集中的页面顺序（从0开始） */
  pageOrder: integer('page_order').notNull().default(0),
  
  /** 是否启用（false表示已删除或隐藏） */
  isActive: boolean('is_active').notNull().default(true),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  /** 按画集查询作品的索引 */
  collectionIdIndex: index('artworks_collection_id_idx').on(table.collectionId),
  
  /** 按启用状态查询的索引 */
  isActiveIndex: index('artworks_is_active_idx').on(table.isActive),
  
  /** 按页面顺序排序的索引 */
  pageOrderIndex: index('artworks_page_order_idx').on(table.pageOrder),
  
  /** 画集和启用状态的复合索引（优化画集内容查询） */
  collectionActiveIndex: index('artworks_collection_active_idx').on(table.collectionId, table.isActive),
  
  /** 画集和页面顺序的复合索引（优化排序查询） */
  collectionOrderIndex: index('artworks_collection_order_idx').on(table.collectionId, table.pageOrder),
  
  /** 画集、启用状态和页面顺序的三元复合索引（优化完整查询） */
  collectionActiveOrderIndex: index('artworks_collection_active_order_idx').on(table.collectionId, table.isActive, table.pageOrder),
  
  /** 文件ID查询索引（新架构） */
  fileIdIndex: index('artworks_file_id_idx').on(table.fileId),
  
  /** 迁移状态查询索引 */
  migrationStatusIndex: index('artworks_migration_status_idx').on(table.migrationStatus),
}));

// ===== 关系定义 =====
// 使用Drizzle ORM的关系定义，实现表之间的关联查询

/**
 * 系统配置表关系
 * 配置表通常只有一条记录，不需要复杂的关系定义
 */
export const comicUniverseConfigsRelations = relations(comicUniverseConfigs, ({ many }) => ({
  // 配置表通常只有一条记录，不需要关系
}));

/**
 * 分类表关系
 * 一个分类可以包含多个画集，并属于一个活动
 */
export const comicUniverseCategoriesRelations = relations(comicUniverseCategories, ({ many }) => ({
  /** 该分类下的所有画集 */
  collections: many(comicUniverseCollections),
}));

/**
 * 标签表关系
 * 一个标签可以关联多个画集（通过关联表），并属于一个活动
 */
export const comicUniverseTagsRelations = relations(comicUniverseTags, ({ many }) => ({
  /** 该标签的所有关联记录 */
  collectionTags: many(comicUniverseCollectionTags),
}));

/**
 * 画集表关系
 * 画集属于一个分类，包含多个作品，可以有多个标签，并属于一个活动
 */
export const comicUniverseCollectionsRelations = relations(comicUniverseCollections, ({ one, many }) => ({
  /** 所属分类 */
  category: one(comicUniverseCategories, {
    fields: [comicUniverseCollections.categoryId],
    references: [comicUniverseCategories.id],
  }),
  
  /** 包含的所有作品页面 */
  artworks: many(comicUniverseArtworks),
  
  /** 关联的所有标签记录 */
  collectionTags: many(comicUniverseCollectionTags),
}));

/**
 * 画集标签关联表关系
 * 连接画集和标签的中间表
 */
export const comicUniverseCollectionTagsRelations = relations(comicUniverseCollectionTags, ({ one }) => ({
  /** 关联的画集 */
  collection: one(comicUniverseCollections, {
    fields: [comicUniverseCollectionTags.collectionId],
    references: [comicUniverseCollections.id],
  }),
  
  /** 关联的标签 */
  tag: one(comicUniverseTags, {
    fields: [comicUniverseCollectionTags.tagId],
    references: [comicUniverseTags.id],
  }),
}));

/**
 * 作品表关系
 * 作品属于一个画集
 */
export const comicUniverseArtworksRelations = relations(comicUniverseArtworks, ({ one }) => ({
  /** 所属画集 */
  collection: one(comicUniverseCollections, {
    fields: [comicUniverseArtworks.collectionId],
    references: [comicUniverseCollections.id],
  }),
})); 
