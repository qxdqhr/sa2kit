import { pgTable, serial, text, timestamp, boolean, varchar, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * ideaList schema（Phase H1a）
 * userId 明文语义；宿主 auth 表由部署侧约束，库内不依赖 @profile/auth。
 */

export const ideaLists = pgTable('idea_lists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 20 }).default('blue'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ideaItems = pgTable('idea_items', {
  id: serial('id').primaryKey(),
  listId: integer('list_id').notNull().references(() => ideaLists.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').notNull().default(false),
  priority: varchar('priority', { length: 10 }).notNull().default('medium'),
  tags: json('tags').$type<string[]>().default([]),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ideaListsRelations = relations(ideaLists, ({ many }) => ({
  items: many(ideaItems),
}));

export const ideaItemsRelations = relations(ideaItems, ({ one }) => ({
  list: one(ideaLists, {
    fields: [ideaItems.listId],
    references: [ideaLists.id],
  }),
}));
