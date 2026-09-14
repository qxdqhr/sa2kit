import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/** 名片表 */
export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  characterName: varchar('character_name', { length: 100 }).notNull(),
  characterDescription: text('character_description'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  backgroundUrl: varchar('background_url', { length: 500 }),
  config: jsonb('config').$type<{
    fontSize?: number;
    fontColor?: string;
    textPosition?: { x: number; y: number };
    avatarPosition?: { x: number; y: number };
    avatarSize?: number;
    theme?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 名片资源表 */
export const cardAssets = pgTable('card_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  name: varchar('name', { length: 100 }).notNull(),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type CardAsset = typeof cardAssets.$inferSelect;
export type NewCardAsset = typeof cardAssets.$inferInsert;
