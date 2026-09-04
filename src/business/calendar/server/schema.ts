import { pgTable, serial, text, timestamp, boolean, varchar, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 日历 schema（Phase F / C2）
 * userId 为明文 FK 语义；宿主 auth 表由部署侧约束，库内不依赖 @profile/auth。
 */

export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  allDay: boolean('all_day').notNull().default(false),
  location: varchar('location', { length: 500 }),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recurrenceRules = pgTable('recurrence_rules', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => calendarEvents.id, { onDelete: 'cascade' }),
  ruleType: varchar('rule_type', { length: 20 }).notNull(),
  interval: integer('interval').notNull().default(1),
  endDate: timestamp('end_date'),
  count: integer('count'),
  byWeekday: json('by_weekday').$type<number[]>(),
  byMonthday: json('by_monthday').$type<number[]>(),
  byMonth: json('by_month').$type<number[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => calendarEvents.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time').notNull(),
  reminderType: varchar('reminder_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calendarConfigs = pgTable('calendar_configs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  firstDayOfWeek: integer('first_day_of_week').notNull().default(1),
  workingHoursStart: varchar('working_hours_start', { length: 5 }).notNull().default('09:00'),
  workingHoursEnd: varchar('working_hours_end', { length: 5 }).notNull().default('18:00'),
  timeZone: varchar('time_zone', { length: 50 }).notNull().default('Asia/Shanghai'),
  dateFormat: varchar('date_format', { length: 20 }).notNull().default('YYYY-MM-DD'),
  timeFormat: varchar('time_format', { length: 20 }).notNull().default('HH:mm'),
  defaultView: varchar('default_view', { length: 20 }).notNull().default('month'),
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
    gray: '#6B7280',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const eventShares = pgTable('event_shares', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => calendarEvents.id, { onDelete: 'cascade' }),
  sharedWithUserId: text('shared_with_user_id').notNull(),
  sharedByUserId: text('shared_by_user_id').notNull(),
  permission: varchar('permission', { length: 20 }).notNull().default('read'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  recurrenceRule: one(recurrenceRules, {
    fields: [calendarEvents.id],
    references: [recurrenceRules.eventId],
  }),
  reminders: many(reminders),
  shares: many(eventShares),
}));

export const recurrenceRulesRelations = relations(recurrenceRules, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [recurrenceRules.eventId],
    references: [calendarEvents.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [reminders.eventId],
    references: [calendarEvents.id],
  }),
}));

export const calendarConfigsRelations = relations(calendarConfigs, () => ({}));

export const eventSharesRelations = relations(eventShares, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventShares.eventId],
    references: [calendarEvents.id],
  }),
}));
