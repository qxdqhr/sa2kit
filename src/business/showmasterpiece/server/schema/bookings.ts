/**
 * ShowMasterpiece 模块 - 预订表结构定义
 * 
 * 这个文件定义了画集预订功能的数据库表结构，使用Drizzle ORM框架。
 * 包含了预订表和相关的关系映射。
 * 
 * 表结构概览：
 * - comicUniverseBookings: 画集预订表
 * 
 * 设计特点：
 * - 完整的外键约束和级联删除
 * - 针对查询场景的索引优化
 * - 支持预订状态管理
 * - 记录用户联系信息和预订详情
 * - 支持用户对同一画集进行多次预订
 * 
 * @fileoverview 数据库表结构 - 画集预订功能
 */

import { relations } from 'drizzle-orm';
import { 
  serial, 
  text, 
  timestamp, 
  pgTable, 
  integer, 
  boolean,
  varchar,
  index
} from 'drizzle-orm/pg-core';
import { comicUniverseCollections } from './masterpieces';

/**
 * 画集预订表 (comic_universe_bookings)
 * 
 * 存储用户对画集的预订信息，包括联系方式和预订详情。
 * 支持预订状态管理和历史记录查询。
 * 
 * 主要功能：
 * - 记录用户预订的画集和数量
 * - 存储用户联系方式（QQ号+手机号）
 * - 预订状态管理（待确认、已确认、已完成、已取消）
 * - 预订时间记录和备注信息
 * - 支持管理员处理预订
 * - 支持对同一画集的多次预订
 */
export const comicUniverseBookings = pgTable('comic_universe_bookings', {
  /** 自增ID（用于内部管理） */
  id: serial('id'),
  
  /** 预订的画集ID（外键，级联删除） */
  collectionId: integer('collection_id').notNull().references(() => comicUniverseCollections.id, { onDelete: 'cascade' }),
  
  /** 用户QQ号 */
  qqNumber: varchar('qq_number', { length: 20 }).notNull(),
  
  /** 用户手机号 */
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  
  /** 预订数量 */
  quantity: integer('quantity').notNull().default(1),
  
  /** 预订状态：pending(待确认)、confirmed(已确认)、completed(已完成)、cancelled(已取消) */
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  
  /** 预订备注信息 */
  notes: text('notes'),
  
  /** 领取方式 */
  pickupMethod: text('pickup_method'),
  
  /** 管理员处理备注 */
  adminNotes: text('admin_notes'),
  
  /** 预订时间 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  /** 确认时间 */
  confirmedAt: timestamp('confirmed_at'),
  
  /** 完成时间 */
  completedAt: timestamp('completed_at'),
  
  /** 取消时间 */
  cancelledAt: timestamp('cancelled_at'),
}, (table) => ({
  // 移除复合主键约束，允许用户对同一画集进行多次预订
  // userCollectionPk: primaryKey({ columns: [table.qqNumber, table.phoneNumber, table.collectionId] }),
  
  /** 按画集查询预订的索引 */
  collectionIdIndex: index('bookings_collection_id_idx').on(table.collectionId),
  
  /** 按状态查询的索引 */
  statusIndex: index('bookings_status_idx').on(table.status),
  
  /** 按QQ号查询的索引 */
  qqNumberIndex: index('bookings_qq_number_idx').on(table.qqNumber),
  
  /** 按手机号查询的索引 */
  phoneNumberIndex: index('bookings_phone_number_idx').on(table.phoneNumber),
  
  /** 按创建时间排序的索引 */
  createdAtIndex: index('bookings_created_at_idx').on(table.createdAt),
  
  /** 画集和状态的复合索引（优化画集预订查询） */
  collectionStatusIndex: index('bookings_collection_status_idx').on(table.collectionId, table.status),
  
  /** QQ号和状态的复合索引（优化用户预订查询） */
  qqStatusIndex: index('bookings_qq_status_idx').on(table.qqNumber, table.status),
  
  /** QQ号+手机号的复合索引（优化用户查询） */
  userIndex: index('bookings_user_idx').on(table.qqNumber, table.phoneNumber),
  
  /** QQ号+手机号+状态的复合索引（优化用户状态查询） */
  userStatusIndex: index('bookings_user_status_idx').on(table.qqNumber, table.phoneNumber, table.status),
}));

// ===== 关系定义 =====

/**
 * 预订表关系
 * 预订属于一个画集
 */
export const comicUniverseBookingsRelations = relations(comicUniverseBookings, ({ one }) => ({
  /** 预订的画集 */
  collection: one(comicUniverseCollections, {
    fields: [comicUniverseBookings.collectionId],
    references: [comicUniverseCollections.id],
  }),
  
})); 
