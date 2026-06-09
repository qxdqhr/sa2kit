/**
 * Auth Schema - Verification Table
 * 验证码表定义
 */

import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * 验证码表（邮箱验证、密码重置等）
 */
export const verifications = pgTable(
  'verifications',
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(), // 邮箱或手机号
    value: text().notNull(), // 验证码
    expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('verifications_identifier_value_key').using(
      'btree',
      table.identifier.asc().nullsLast().op('text_ops'),
      table.value.asc().nullsLast().op('text_ops')
    ),
  ]
);

/**
 * 类型定义
 */
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

