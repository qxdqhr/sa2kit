import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * teachHub schema（Phase F / T2）
 * userId 明文；宿主 auth FK 由部署侧保证，库内不依赖 @profile/auth。
 */

export const teachWorkspaces = pgTable(
  'teach_workspaces',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    topic: text('topic'),
    status: text('status').notNull().default('active'),
    missionSummary: text('mission_summary'),
    lessonCount: integer('lesson_count').notNull().default(0),
    lastLessonSlug: text('last_lesson_slug'),
    lastOpenedAt: timestamp('last_opened_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userSlugUnique: uniqueIndex('teach_workspaces_user_slug_unique').on(
      table.userId,
      table.slug,
    ),
  }),
);

export const teachLessonProgress = pgTable(
  'teach_lesson_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => teachWorkspaces.id, { onDelete: 'cascade' }),
    lessonSlug: text('lesson_slug').notNull(),
    lessonOrder: integer('lesson_order').notNull(),
    status: text('status').notNull().default('available'),
    quizScore: integer('quiz_score'),
    quizTotal: integer('quiz_total'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    nextReviewAt: timestamp('next_review_at'),
  },
  (table) => ({
    workspaceLessonUnique: uniqueIndex('teach_lesson_progress_workspace_lesson_unique').on(
      table.workspaceId,
      table.lessonSlug,
    ),
  }),
);

export const teachGenerateJobs = pgTable('teach_generate_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => teachWorkspaces.id, { onDelete: 'cascade' }),
  trigger: text('trigger').notNull(),
  status: text('status').notNull().default('pending'),
  inputSnapshot: jsonb('input_snapshot'),
  outputFiles: jsonb('output_files'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  finishedAt: timestamp('finished_at'),
});
