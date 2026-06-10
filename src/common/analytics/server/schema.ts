/**
 * 埋点系统数据库 Schema
 * Analytics Database Schema
 *
 * 使用方式：
 * 在 backend/drizzle/migrations/schema.ts 中导入并导出：
 * export { analyticsEvents } from '@lyricnote/shared/analytics/server/schema'
 */

import { pgTable, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * 埋点事件表
 */
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: text().primaryKey().notNull(),
    eventType: text('event_type').notNull(),
    eventName: text('event_name').notNull(),
    timestamp: timestamp({ precision: 3, mode: 'string' }).notNull(),
    priority: integer().notNull(),

    userId: text('user_id'),
    sessionId: text('session_id').notNull(),
    deviceId: text('device_id').notNull(),

    pageUrl: text('page_url'),
    pageTitle: text('page_title'),
    referrer: text(),

    properties: jsonb(),

    platform: text().notNull(),
    appVersion: text('app_version').notNull(),
    sdkVersion: text('sdk_version').notNull(),

    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('analytics_events_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops')
    ),
    index('analytics_events_event_type_idx').using(
      'btree',
      table.eventType.asc().nullsLast().op('text_ops')
    ),
    index('analytics_events_platform_idx').using(
      'btree',
      table.platform.asc().nullsLast().op('text_ops')
    ),
    index('analytics_events_timestamp_idx').using('btree', table.timestamp.desc().nullsLast()),
    index('analytics_events_session_id_idx').using(
      'btree',
      table.sessionId.asc().nullsLast().op('text_ops')
    ),
  ]
);

/**
 * 创建外键关系（需要在使用时手动添加）
 *
 * 在你的 schema.ts 中添加：
 *
 * foreignKey({
 *   columns: [analyticsEvents.userId],
 *   foreignColumns: [user.id],
 *   name: "analytics_events_userId_fkey"
 * }).onUpdate("cascade").onDelete("set null")
 */
