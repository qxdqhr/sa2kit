import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { FestivalCardConfig } from '../../types';

export const festivalCardConfigs = pgTable('festival_card_configs', {
  id: text('id').primaryKey(),
  name: text('name'),
  config: jsonb('config').$type<FestivalCardConfig>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

