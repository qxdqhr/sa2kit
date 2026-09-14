import { pgTable, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const vocaloidBoothRecords = pgTable(
  'vocaloid_booth_records',
  {
    id: text('id').primaryKey(),
    matchCode: text('match_code').notNull().unique(),
    boothId: text('booth_id').notNull(),
    status: text('status').notNull().default('active'),
    metadata: jsonb('metadata'),
    files: jsonb('files').notNull(),
    downloadCount: integer('download_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    matchCodeIdx: index('idx_vocaloid_booth_records_match_code').on(table.matchCode),
    boothIdIdx: index('idx_vocaloid_booth_records_booth_id').on(table.boothId),
    expiresAtIdx: index('idx_vocaloid_booth_records_expires_at').on(table.expiresAt),
  })
);
