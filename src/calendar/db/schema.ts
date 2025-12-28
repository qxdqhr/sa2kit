import { pgTable, serial, text, timestamp, boolean, varchar, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user as users } from '../../auth/schema';

/**
 * 日历事件表
 */
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  allDay: boolean('all_day').notNull().default(false),
  location: varchar('location', { length: 500 }),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'), // 十六进制颜色值
  priority: varchar('priority', { length: 10 }).notNull().default('normal'), // low, normal, high, urgent
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 重复规则表
 */
export const recurrenceRules = pgTable('recurrence_rules', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => calendarEvents.id, { onDelete: 'cascade' }),
  ruleType: varchar('rule_type', { length: 20 }).notNull(), // daily, weekly, monthly, yearly, custom
  interval: integer('interval').notNull().default(1), // 间隔
  endDate: timestamp('end_date'), // 结束日期
  count: integer('count'), // 重复次数
  byWeekday: json('by_weekday').$type<number[]>(), // 周几重复 [0,1,2,3,4,5,6]，0=周日
  byMonthday: json('by_monthday').$type<number[]>(), // 月中的第几天 [1,2,...,31]
  byMonth: json('by_month').$type<number[]>(), // 第几月 [1,2,...,12]
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 提醒表
 */
export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => calendarEvents.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time').notNull(), // 提醒时间
  reminderType: varchar('reminder_type', { length: 20 }).notNull(), // notification, email, sms
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, sent, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 日历配置表 - 用户个人日历设置
 */
export const calendarConfigs = pgTable('calendar_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  firstDayOfWeek: integer('first_day_of_week').notNull().default(1), // 0=周日, 1=周一
  workingHoursStart: varchar('working_hours_start', { length: 5 }).notNull().default('09:00'),
  workingHoursEnd: varchar('working_hours_end', { length: 5 }).notNull().default('18:00'),
  timeZone: varchar('time_zone', { length: 50 }).notNull().default('Asia/Shanghai'),
  dateFormat: varchar('date_format', { length: 20 }).notNull().default('YYYY-MM-DD'),
  timeFormat: varchar('time_format', { length: 20 }).notNull().default('HH:mm'),
  defaultView: varchar('default_view', { length: 20 }).notNull().default('month'), // month, week, day, agenda
  defaultEventColor: varchar('default_event_color', { length: 7 }).notNull().default('#3B82F6'),
  weekends: boolean('weekends').notNull().default(true),
  eventColors: json('event_colors').$type<Record<string, string>>().default({
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    red: '#EF4444',
    yellow: '#F59E0B',
    pink: '#EC4899',
    indigo: '#6366F1',
    gray: '#6B7280'
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 事件分享表 - 用于共享日历功能
 */
export const eventShares = pgTable('event_shares', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => calendarEvents.id, { onDelete: 'cascade' }),
  sharedWithUserId: integer('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sharedByUserId: integer('shared_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 20 }).notNull().default('read'), // read, write
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===== 关系定义 =====

/**
 * 日历事件关系
 */
export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  recurrenceRule: one(recurrenceRules, {
    fields: [calendarEvents.id],
    references: [recurrenceRules.eventId],
  }),
  reminders: many(reminders),
  shares: many(eventShares),
}));

/**
 * 重复规则关系
 */
export const recurrenceRulesRelations = relations(recurrenceRules, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [recurrenceRules.eventId],
    references: [calendarEvents.id],
  }),
}));

/**
 * 提醒关系
 */
export const remindersRelations = relations(reminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [reminders.eventId],
    references: [calendarEvents.id],
  }),
}));

/**
 * 日历配置关系
 */
export const calendarConfigsRelations = relations(calendarConfigs, ({ one }) => ({
  user: one(users, {
    fields: [calendarConfigs.userId],
    references: [users.id],
  }),
}));

/**
 * 事件分享关系
 */
export const eventSharesRelations = relations(eventShares, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventShares.eventId],
    references: [calendarEvents.id],
  }),
  sharedWithUser: one(users, {
    fields: [eventShares.sharedWithUserId],
    references: [users.id],
  }),
  sharedByUser: one(users, {
    fields: [eventShares.sharedByUserId],
    references: [users.id],
  }),
}));

// 所有表和关系已在上面使用 export 关键字导出 