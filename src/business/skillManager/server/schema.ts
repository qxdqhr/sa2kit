import { integer, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * skillManager schema（Phase H2）
 * 同步任务与状态表；Skill 文件本体走 OSS + file 元数据。
 */

export const skillManagerSyncTasks = pgTable('skill_manager_sync_tasks', {
  taskId: text('task_id').primaryKey(),
  mode: text('mode').notNull(),
  strategy: text('strategy').notNull(),
  status: text('status').notNull(),
  total: integer('total').notNull(),
  successCount: integer('success_count').notNull(),
  failedCount: integer('failed_count').notNull(),
  createdAt: timestamp('created_at').notNull(),
  finishedAt: timestamp('finished_at'),
  items: json('items').notNull(),
  metrics: json('metrics'),
  logs: json('logs'),
});

export const skillManagerSyncStates = pgTable('skill_manager_sync_states', {
  skillId: text('skill_id').primaryKey(),
  baseHash: text('base_hash').notNull().default(''),
  remoteHash: text('remote_hash').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
