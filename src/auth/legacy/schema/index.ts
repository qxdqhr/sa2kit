import { pgTable, serial, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 用户表
export const legacyUsers = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户会话表
export const legacyUserSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => legacyUsers.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 验证码表
export const legacyVerificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  used: boolean('used').default(false).notNull(),
});

// 关系定义
export const legacyUsersRelations = relations(legacyUsers, ({ many }) => ({
  sessions: many(legacyUserSessions),
}));

export const legacyUserSessionsRelations = relations(legacyUserSessions, ({ one }) => ({
  user: one(legacyUsers, {
    fields: [legacyUserSessions.userId],
    references: [legacyUsers.id],
  }),
}));
