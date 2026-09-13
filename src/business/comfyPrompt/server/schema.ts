/** comfyPrompt schema（Phase H1c）：userId 明文语义，不依赖 @profile/auth。 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const comfyPromptGroups = pgTable('comfy_prompt_groups', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 20 }).default('violet'),
  kind: varchar('kind', { length: 20 }).notNull().default('positive'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comfyPrompts = pgTable('comfy_prompts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  groupId: integer('group_id').references(() => comfyPromptGroups.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  kind: varchar('kind', { length: 20 }).notNull().default('positive'),
  tags: json('tags').$type<string[]>().default([]),
  weight: numeric('weight', { precision: 4, scale: 2 }),
  order: integer('order').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comfyPromptSets = pgTable('comfy_prompt_sets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  kind: varchar('kind', { length: 20 }).notNull().default('positive'),
  separator: varchar('separator', { length: 20 }).notNull().default(', '),
  tags: json('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comfyPromptSetItems = pgTable('comfy_prompt_set_items', {
  id: serial('id').primaryKey(),
  setId: integer('set_id')
    .notNull()
    .references(() => comfyPromptSets.id, { onDelete: 'cascade' }),
  promptId: integer('prompt_id')
    .notNull()
    .references(() => comfyPrompts.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
  customPrefix: text('custom_prefix'),
  customSuffix: text('custom_suffix'),
});

export const comfyWorkflows = pgTable('comfy_workflows', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  workflowJson: json('workflow_json').$type<Record<string, unknown>>().notNull(),
  positiveNodeId: varchar('positive_node_id', { length: 32 }),
  negativeNodeId: varchar('negative_node_id', { length: 32 }),
  seedNodeId: varchar('seed_node_id', { length: 32 }),
  latentNodeId: varchar('latent_node_id', { length: 32 }),
  tags: json('tags').$type<string[]>().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comfyServers = pgTable('comfy_servers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  baseUrl: text('base_url').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  enabled: boolean('enabled').notNull().default(true),
  lastCheckAt: timestamp('last_check_at'),
  lastCheckOk: boolean('last_check_ok'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comfyJobs = pgTable('comfy_jobs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  serverId: integer('server_id')
    .notNull()
    .references(() => comfyServers.id, { onDelete: 'cascade' }),
  workflowId: integer('workflow_id').references(() => comfyWorkflows.id, { onDelete: 'set null' }),
  clientId: varchar('client_id', { length: 64 }).notNull(),
  promptId: varchar('prompt_id', { length: 64 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  positivePrompt: text('positive_prompt'),
  negativePrompt: text('negative_prompt'),
  requestJson: json('request_json').$type<Record<string, unknown>>(),
  responseJson: json('response_json').$type<Record<string, unknown>>(),
  outputImages: json('output_images').$type<ComfyJobOutputImage[]>().default([]),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export type ComfyJobOutputImage = {
  filename: string;
  subfolder: string;
  type: string;
};

export const comfyPromptGroupsRelations = relations(comfyPromptGroups, ({ many }) => ({
  prompts: many(comfyPrompts),
}));

export const comfyPromptsRelations = relations(comfyPrompts, ({ one, many }) => ({
  group: one(comfyPromptGroups, { fields: [comfyPrompts.groupId], references: [comfyPromptGroups.id] }),
  setItems: many(comfyPromptSetItems),
}));

export const comfyPromptSetsRelations = relations(comfyPromptSets, ({ many }) => ({
  items: many(comfyPromptSetItems),
}));

export const comfyPromptSetItemsRelations = relations(comfyPromptSetItems, ({ one }) => ({
  set: one(comfyPromptSets, { fields: [comfyPromptSetItems.setId], references: [comfyPromptSets.id] }),
  prompt: one(comfyPrompts, { fields: [comfyPromptSetItems.promptId], references: [comfyPrompts.id] }),
}));

export const comfyWorkflowsRelations = relations(comfyWorkflows, ({ many }) => ({
  jobs: many(comfyJobs),
}));

export const comfyServersRelations = relations(comfyServers, ({ many }) => ({
  jobs: many(comfyJobs),
}));

export const comfyJobsRelations = relations(comfyJobs, ({ one }) => ({
  server: one(comfyServers, { fields: [comfyJobs.serverId], references: [comfyServers.id] }),
  workflow: one(comfyWorkflows, { fields: [comfyJobs.workflowId], references: [comfyWorkflows.id] }),
}));
