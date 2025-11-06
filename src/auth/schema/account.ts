/**
 * Auth Schema - Account Table
 * 第三方账号关联表定义
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
 * 第三方账号表（支持 OAuth 登录）
 */
export const account = pgTable(
  'Account',
  {
    id: text().primaryKey().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(), // 提供商: github, google, wechat 等
    userId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
    refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  (table) => [
    uniqueIndex('Account_providerId_accountId_key').using(
      'btree',
      table.providerId.asc().nullsLast().op('text_ops'),
      table.accountId.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Account_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

/**
 * 类型定义
 */
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

