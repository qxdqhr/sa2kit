import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  json,
  numeric,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/** fitnessPlan schema（Phase H1c）：userId 明文语义，不依赖 @profile/auth。 */

export const fitnessProfiles = pgTable('fitness_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  goal: varchar('goal', { length: 32 }).notNull().default('maintain'),
  currentWeight: numeric('current_weight', { precision: 6, scale: 2 }),
  weightUnit: varchar('weight_unit', { length: 8 }).notNull().default('kg'),
  dailyCalorieGoal: integer('daily_calorie_goal').notNull().default(2000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const exercises = pgTable('fitness_exercises', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: varchar('name', { length: 120 }).notNull(),
  type: varchar('type', { length: 16 }).notNull(),
  bodyPart: varchar('body_part', { length: 32 }),
  equipment: varchar('equipment', { length: 32 }),
  cardioType: varchar('cardio_type', { length: 32 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workoutPlans = pgTable('fitness_workout_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  goalTags: json('goal_tags').$type<string[]>().default([]),
  status: varchar('status', { length: 16 }).notNull().default('active'),
  isTemplate: boolean('is_template').notNull().default(false),
  sourceTemplateId: integer('source_template_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workoutPlanItems = pgTable('fitness_workout_plan_items', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id')
    .notNull()
    .references(() => workoutPlans.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
  targetSets: integer('target_sets'),
  targetReps: integer('target_reps'),
  targetWeight: numeric('target_weight', { precision: 8, scale: 2 }),
  restSeconds: integer('rest_seconds').default(90),
  targetDurationMinutes: integer('target_duration_minutes'),
  targetDistance: numeric('target_distance', { precision: 8, scale: 2 }),
  targetCalories: integer('target_calories'),
});

export const scheduleTemplates = pgTable('fitness_schedule_templates', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  cycleWeeks: integer('cycle_weeks').notNull().default(4),
  weekPattern: json('week_pattern')
    .$type<Record<string, number | 'rest' | null>>()
    .notNull()
    .default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduleOverrides = pgTable(
  'fitness_schedule_overrides',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    scheduleDate: date('schedule_date').notNull(),
    planId: integer('plan_id').references(() => workoutPlans.id, {
      onDelete: 'set null',
    }),
    isRest: boolean('is_rest').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userDateUnique: uniqueIndex('fitness_schedule_overrides_user_date').on(
      table.userId,
      table.scheduleDate,
    ),
  }),
);

export const workoutSessions = pgTable('fitness_workout_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  planId: integer('plan_id').references(() => workoutPlans.id, {
    onDelete: 'set null',
  }),
  status: varchar('status', { length: 16 }).notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
  notes: text('notes'),
  summaryJson: json('summary_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workoutSessionItems = pgTable('fitness_workout_session_items', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const workoutSets = pgTable('fitness_workout_sets', {
  id: serial('id').primaryKey(),
  sessionItemId: integer('session_item_id')
    .notNull()
    .references(() => workoutSessionItems.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  weight: numeric('weight', { precision: 8, scale: 2 }),
  reps: integer('reps'),
  durationMinutes: integer('duration_minutes'),
  distance: numeric('distance', { precision: 8, scale: 2 }),
  calories: integer('calories'),
  isCompleted: boolean('is_completed').notNull().default(false),
});

export const foodItems = pgTable('fitness_food_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: varchar('name', { length: 120 }).notNull(),
  calories: integer('calories').notNull(),
  protein: numeric('protein', { precision: 6, scale: 2 }),
  carbs: numeric('carbs', { precision: 6, scale: 2 }),
  fat: numeric('fat', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dietLogs = pgTable(
  'fitness_diet_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    logDate: date('log_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userDateUnique: uniqueIndex('fitness_diet_logs_user_date').on(
      table.userId,
      table.logDate,
    ),
  }),
);

export const dietLogEntries = pgTable('fitness_diet_log_entries', {
  id: serial('id').primaryKey(),
  dietLogId: integer('diet_log_id')
    .notNull()
    .references(() => dietLogs.id, { onDelete: 'cascade' }),
  mealType: varchar('meal_type', { length: 16 }).notNull(),
  foodName: varchar('food_name', { length: 120 }).notNull(),
  foodItemId: integer('food_item_id').references(() => foodItems.id, {
    onDelete: 'set null',
  }),
  calories: integer('calories').notNull(),
  protein: numeric('protein', { precision: 6, scale: 2 }),
  carbs: numeric('carbs', { precision: 6, scale: 2 }),
  fat: numeric('fat', { precision: 6, scale: 2 }),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailyCheckins = pgTable(
  'fitness_daily_checkins',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    checkinDate: date('checkin_date').notNull(),
    type: varchar('type', { length: 16 }).notNull(),
    refId: integer('ref_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userDateTypeUnique: uniqueIndex('fitness_daily_checkins_user_date_type').on(
      table.userId,
      table.checkinDate,
      table.type,
    ),
  }),
);

export const workoutPlansRelations = relations(workoutPlans, ({ many }) => ({
  items: many(workoutPlanItems),
}));

export const workoutPlanItemsRelations = relations(workoutPlanItems, ({ one }) => ({
  plan: one(workoutPlans, {
    fields: [workoutPlanItems.planId],
    references: [workoutPlans.id],
  }),
  exercise: one(exercises, {
    fields: [workoutPlanItems.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  plan: one(workoutPlans, {
    fields: [workoutSessions.planId],
    references: [workoutPlans.id],
  }),
  items: many(workoutSessionItems),
}));

export const dietLogsRelations = relations(dietLogs, ({ many }) => ({
  entries: many(dietLogEntries),
}));
