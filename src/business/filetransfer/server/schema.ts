import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export type TransferStatus = 'pending' | 'completed' | 'failed';

export const fileTransfers = pgTable('file_transfers', {
  id: text('id').primaryKey(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  filePath: text('file_path').notNull(),
  uploaderId: text('uploader_id').notNull(),
  status: text('status').$type<TransferStatus>().notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  downloadCount: integer('download_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});
