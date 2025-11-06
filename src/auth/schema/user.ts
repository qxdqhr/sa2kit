/**
 * Auth Schema - User Table
 * 用户表定义
 */

import { pgTable, text, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userRole } from './enums';

/**
 * 用户表
 */
export const user = pgTable(
  'User',
  {
    id: text().primaryKey().notNull(),
    email: text().notNull(),
    emailVerified: boolean().default(false).notNull(),
    username: text().notNull(),
    password: text(),
    name: text(),
    nickname: text(),
    image: text(),
    avatar: text(),
    role: userRole().default('USER').notNull(),
    preferences: jsonb(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
    twoFactorEnabled: boolean().default(false).notNull(),
  },
  (table) => [
    uniqueIndex('User_email_key').using('btree', table.email.asc().nullsLast().op('text_ops')),
    uniqueIndex('User_username_key').using(
      'btree',
      table.username.asc().nullsLast().op('text_ops')
    ),
  ]
);

/**
 * 类型定义
 */
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

