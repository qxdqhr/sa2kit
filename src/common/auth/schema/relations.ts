/**
 * Auth Schema - Relations
 * 表关系定义
 */

import { relations } from 'drizzle-orm';
import { user } from './user';
import { session } from './session';
import { account } from './account';

/**
 * User 表关系
 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

/**
 * Session 表关系
 */
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

/**
 * Account 表关系
 */
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

