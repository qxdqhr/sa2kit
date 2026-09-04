import { relations } from 'drizzle-orm';
import { serial, text, timestamp, pgTable, json, integer } from 'drizzle-orm/pg-core';

export const examTypes = pgTable('exam_types', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const examMetadata = pgTable('exam_metadata', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull(),
  lastModified: timestamp('last_modified').notNull(),
});

export const examQuestions = pgTable('exam_questions', {
  id: serial('id').primaryKey(),
  examTypeId: text('exam_type_id').notNull().references(() => examTypes.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),
  options: json('options').notNull(),
  answer: text('answer'),
  answers: json('answers'),
  score: integer('score').notNull(),
  audioUrl: text('audio_url'),
  specialEffect: json('special_effect'),
});

export const examStartScreens = pgTable('exam_start_screens', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  rules: json('rules').notNull(),
  buttonText: text('button_text').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const examResultModals = pgTable('exam_result_modals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  showDelayTime: integer('show_delay_time').notNull(),
  messages: json('messages').notNull(),
  buttonText: text('button_text').notNull(),
  passingScore: integer('passing_score').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const examTypesRelations = relations(examTypes, ({ one }) => ({
  metadata: one(examMetadata, {
    fields: [examTypes.id],
    references: [examMetadata.id],
  }),
  startScreen: one(examStartScreens, {
    fields: [examTypes.id],
    references: [examStartScreens.id],
  }),
  resultModal: one(examResultModals, {
    fields: [examTypes.id],
    references: [examResultModals.id],
  }),
}));

export const examMetadataRelations = relations(examMetadata, ({ one }) => ({
  examType: one(examTypes, {
    fields: [examMetadata.id],
    references: [examTypes.id],
  }),
}));

export const examQuestionsRelations = relations(examQuestions, ({ many }) => ({
  examType: many(examTypes),
}));

export const examStartScreensRelations = relations(examStartScreens, ({ one }) => ({
  examType: one(examTypes, {
    fields: [examStartScreens.id],
    references: [examTypes.id],
  }),
}));

export const examResultModalsRelations = relations(examResultModals, ({ one }) => ({
  examType: one(examTypes, {
    fields: [examResultModals.id],
    references: [examTypes.id],
  }),
}));
