/**
 * ShowMasterpiece 模块 - 弹窗配置表结构
 * 
 * 管理限时弹窗的配置信息
 * 
 * @fileoverview 弹窗配置数据库schema
 */

import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 弹窗配置表
 */
export const popupConfigs = pgTable('popup_configs', {
  /** 配置ID */
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  /** 配置名称 */
  name: text('name').notNull(),
  
  /** 配置描述 */
  description: text('description'),
  
  /** 弹窗类型 */
  type: text('type').notNull().default('deadline'), // deadline, announcement, etc.
  
  /** 是否启用 */
  enabled: boolean('enabled').default(false),
  
  /** 触发条件配置 */
  triggerConfig: jsonb('trigger_config').notNull().$type<{
    /** 截止时间 ISO 字符串 */
    deadlineTime?: string;
    /** 提前提醒时间（分钟） */
    advanceMinutes?: number;
    /** 触发条件类型 */
    triggerType: 'after_deadline' | 'before_deadline' | 'always';
  }>(),
  
  /** 弹窗内容配置 */
  contentConfig: jsonb('content_config').notNull().$type<{
    /** 弹窗标题 */
    title: string;
    /** 弹窗内容 */
    message: string;
    /** 确认按钮文本 */
    confirmText?: string;
    /** 取消按钮文本 */
    cancelText?: string;
    /** 是否显示取消按钮 */
    showCancel?: boolean;
    /** 弹窗主题 */
    theme?: 'warning' | 'info' | 'error' | 'success';
  }>(),
  
  /** 显示设置 */
  displayConfig: jsonb('display_config').$type<{
    /** 弹窗宽度 */
    width?: number;
    /** 弹窗高度 */
    height?: number | string;
    /** 是否可点击遮罩关闭 */
    maskClosable?: boolean;
    /** 自动关闭时间（秒，0表示不自动关闭） */
    autoCloseSeconds?: number;
  }>(),

  /** 是否阻断流程 - true: 阻断提交，false: 仅提醒但允许继续 */
  blockProcess: boolean('block_process').default(false),
  
  /** 业务模块 */
  businessModule: text('business_module').notNull().default('showmasterpiece'),
  
  /** 业务场景 */
  businessScene: text('business_scene').notNull().default('cart_checkout'),
  
  /** 排序权重 */
  sortOrder: text('sort_order').default('0'),
  
  /** 创建时间 */
  createdAt: timestamp('created_at').defaultNow(),
  
  /** 更新时间 */
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * 弹窗配置表关系
 */
export const popupConfigsRelations = relations(popupConfigs, () => ({}));

export type PopupConfig = typeof popupConfigs.$inferSelect;
export type NewPopupConfig = typeof popupConfigs.$inferInsert;
