import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

type TicketSource = 'eplus' | 'asobistore' | 'piapro' | 'lawsonticket';

export const ticketMonitorEvents = pgTable('ticket_monitor_events', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id', { length: 128 }).notNull().unique(),
  source: varchar('source', { length: 32 }).notNull(),
  title: text('title').notNull(),
  receptionTitle: text('reception_title'),
  seatInfo: text('seat_info'),
  ticketOpenAt: timestamp('ticket_open_at', { withTimezone: true }).notNull(),
  ticketEndAt: timestamp('ticket_end_at', { withTimezone: true }),
  status: varchar('status', { length: 16 }).notNull(),
  eventUrl: text('event_url').notNull(),
  coverImage: text('cover_image'),
  location: text('location'),
  tags: jsonb('tags').$type<string[]>().default([]),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ticketMonitorConfig = pgTable('ticket_monitor_config', {
  id: serial('id').primaryKey(),
  notificationsEnabled: boolean('notifications_enabled').notNull().default(false),
  feishuWebhookUrl: text('feishu_webhook_url'),
  feishuSignSecret: text('feishu_sign_secret'),
  newEventEnabled: boolean('new_event_enabled').notNull().default(true),
  newEventPlatforms: jsonb('new_event_platforms').$type<TicketSource[]>().notNull().default(['asobistore']),
  endingSoonEnabled: boolean('ending_soon_enabled').notNull().default(true),
  endingSoonDaysList: jsonb('ending_soon_days_list').$type<number[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ticketMonitorNotifyLogs = pgTable('ticket_monitor_notify_logs', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id', { length: 128 }),
  triggerType: varchar('trigger_type', { length: 32 }).notNull(),
  dedupeKey: varchar('dedupe_key', { length: 256 }).notNull().unique(),
  source: varchar('source', { length: 32 }),
  title: text('title'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  feishuStatus: varchar('feishu_status', { length: 16 }).notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ticketMonitorSyncRuns = pgTable('ticket_monitor_sync_runs', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  sourcesTotal: integer('sources_total').notNull().default(0),
  sourcesFailed: integer('sources_failed').notNull().default(0),
  eventsUpserted: integer('events_upserted').notNull().default(0),
  newEventsFound: integer('new_events_found').notNull().default(0),
  endingSoonTriggered: integer('ending_soon_triggered').notNull().default(0),
  notificationsSent: integer('notifications_sent').notNull().default(0),
  errors: jsonb('errors').$type<string[]>().notNull().default([]),
  status: varchar('status', { length: 16 }).notNull().default('running'),
});
