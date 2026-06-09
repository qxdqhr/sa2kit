/**
 * Auth Schema - Session Table
 * 会话表定义
 */

import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user';

/**
 * 会话表
 */
export const session = pgTable(
  'Session',
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    token: text().notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('Session_token_key').using('btree', table.token.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Session_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

/**
 * 类型定义
 */
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

