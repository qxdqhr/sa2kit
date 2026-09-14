/**
 * MMD 资源库表（mmd_models / animations / audios / scenes / favorites）
 * 与 drizzle-schema.ts 的 playlist 管理表并存；userId 为纯文本，不耦合宿主 auth schema。
 */
import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  real,
  json,
} from 'drizzle-orm/pg-core';

export const mmdModels = pgTable('mmd_models', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  thumbnailPath: varchar('thumbnail_path', { length: 500 }),
  fileSize: integer('file_size').notNull(),
  format: varchar('format', { length: 10 }).notNull(),
  uploadTime: timestamp('upload_time').defaultNow().notNull(),
  userId: text('user_id'),
  tags: json('tags').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(false),
  downloadCount: integer('download_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmdAnimations = pgTable('mmd_animations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  duration: real('duration').notNull(),
  frameCount: integer('frame_count').notNull(),
  uploadTime: timestamp('upload_time').defaultNow().notNull(),
  userId: text('user_id'),
  tags: json('tags').$type<string[]>(),
  isPublic: boolean('is_public').notNull().default(false),
  compatibleModels: json('compatible_models').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmdAudios = pgTable('mmd_audios', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  duration: real('duration').notNull(),
  format: varchar('format', { length: 10 }).notNull(),
  uploadTime: timestamp('upload_time').defaultNow().notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmdScenes = pgTable('mmd_scenes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  modelId: integer('model_id')
    .notNull()
    .references(() => mmdModels.id, { onDelete: 'cascade' }),
  animationId: integer('animation_id').references(() => mmdAnimations.id, {
    onDelete: 'set null',
  }),
  audioId: integer('audio_id').references(() => mmdAudios.id, { onDelete: 'set null' }),
  cameraPosition: json('camera_position')
    .$type<{ x: number; y: number; z: number }>()
    .notNull(),
  cameraTarget: json('camera_target')
    .$type<{ x: number; y: number; z: number }>()
    .notNull(),
  lighting: json('lighting')
    .$type<{
      ambientLight: { color: string; intensity: number };
      directionalLight: {
        color: string;
        intensity: number;
        position: { x: number; y: number; z: number };
      };
    }>()
    .notNull(),
  background: json('background')
    .$type<{
      type: 'color' | 'image' | 'skybox';
      value: string;
    }>()
    .notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmdModelFavorites = pgTable('mmd_model_favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  modelId: integer('model_id')
    .notNull()
    .references(() => mmdModels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mmdAnimationFavorites = pgTable('mmd_animation_favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  animationId: integer('animation_id')
    .notNull()
    .references(() => mmdAnimations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mmdModelsRelations = relations(mmdModels, ({ many }) => ({
  scenes: many(mmdScenes),
  favorites: many(mmdModelFavorites),
}));

export const mmdAnimationsRelations = relations(mmdAnimations, ({ many }) => ({
  scenes: many(mmdScenes),
  favorites: many(mmdAnimationFavorites),
}));

export const mmdAudiosRelations = relations(mmdAudios, ({ many }) => ({
  scenes: many(mmdScenes),
}));

export const mmdScenesRelations = relations(mmdScenes, ({ one }) => ({
  model: one(mmdModels, {
    fields: [mmdScenes.modelId],
    references: [mmdModels.id],
  }),
  animation: one(mmdAnimations, {
    fields: [mmdScenes.animationId],
    references: [mmdAnimations.id],
  }),
  audio: one(mmdAudios, {
    fields: [mmdScenes.audioId],
    references: [mmdAudios.id],
  }),
}));

export const mmdModelFavoritesRelations = relations(mmdModelFavorites, ({ one }) => ({
  model: one(mmdModels, {
    fields: [mmdModelFavorites.modelId],
    references: [mmdModels.id],
  }),
}));

export const mmdAnimationFavoritesRelations = relations(
  mmdAnimationFavorites,
  ({ one }) => ({
    animation: one(mmdAnimations, {
      fields: [mmdAnimationFavorites.animationId],
      references: [mmdAnimations.id],
    }),
  }),
);

export type MmdModelRow = typeof mmdModels.$inferSelect;
export type NewMmdModelRow = typeof mmdModels.$inferInsert;
export type MmdAnimationRow = typeof mmdAnimations.$inferSelect;
export type NewMmdAnimationRow = typeof mmdAnimations.$inferInsert;
export type MmdAudioRow = typeof mmdAudios.$inferSelect;
export type NewMmdAudioRow = typeof mmdAudios.$inferInsert;
export type MmdSceneRow = typeof mmdScenes.$inferSelect;
export type NewMmdSceneRow = typeof mmdScenes.$inferInsert;
