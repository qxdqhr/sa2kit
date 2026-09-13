import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import systemExercises from '../domain/data/systemExercises.json';
import systemFoods from '../domain/data/systemFoods.json';
import { PLAN_TEMPLATES } from '../domain/data/planTemplates';
import {
  dailyCheckins,
  dietLogEntries,
  dietLogs,
  exercises,
  fitnessProfiles,
  foodItems,
  scheduleOverrides,
  scheduleTemplates,
  workoutPlanItems,
  workoutPlans,
  workoutSessionItems,
  workoutSessions,
  workoutSets,
} from './schema';
import type {
  CheckinHeatmapDay,
  CheckinHeatmapPayload,
  CheckinStreakInfo,
  CheckinTodayState,
  CheckinType,
  StatsBodyPartSlice,
  CompleteWorkoutInput,
  DietDayPayload,
  DietEntryInput,
  DietEntryUpdateInput,
  DietLogEntryRecord,
  ExerciseFormData,
  ExerciseRecord,
  FitnessGoal,
  FitnessProfileFormData,
  FoodItemFormData,
  FoodItemRecord,
  ManualCheckinInput,
  MonthSchedulePayload,
  PlanItemInput,
  ScheduleDayInfo,
  ScheduleOverrideInput,
  ScheduleTemplateInput,
  ScheduleTemplateRecord,
  StartWorkoutInput,
  StatsOverviewPayload,
  StatsPrRecord,
  StatsTrendPoint,
  TodayOverviewPayload,
  UpdateWorkoutSetInput,
  WeekDayKey,
  WorkoutPlanDetail,
  WorkoutPlanFormData,
  WorkoutPlanRecord,
  WorkoutPlanStatus,
  WorkoutSessionDetail,
  WorkoutSessionListItem,
  WorkoutSessionSummary,
  WorkoutSetRecord,
} from '../domain/types';
import { dateToWeekDayKey, formatDateKey, BODY_PART_LABELS } from '../domain/types';
import { formatCalendarDate, getMonthViewDates } from '../domain/utils/calendarDateUtils';

function mapExercise(row: typeof exercises.$inferSelect): ExerciseRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type as ExerciseRecord['type'],
    bodyPart: row.bodyPart,
    equipment: row.equipment,
    cardioType: row.cardioType,
    description: row.description,
    isCustom: row.userId != null,
  };
}

function mapFoodItem(row: typeof foodItems.$inferSelect): FoodItemRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    calories: row.calories,
    protein: row.protein != null ? Number(row.protein) : null,
    carbs: row.carbs != null ? Number(row.carbs) : null,
    fat: row.fat != null ? Number(row.fat) : null,
    isCustom: row.userId != null,
  };
}

function mapDietEntry(row: typeof dietLogEntries.$inferSelect): DietLogEntryRecord {
  return {
    id: row.id,
    dietLogId: row.dietLogId,
    mealType: row.mealType as DietLogEntryRecord['mealType'],
    foodName: row.foodName,
    foodItemId: row.foodItemId,
    calories: row.calories,
    protein: row.protein != null ? Number(row.protein) : null,
    carbs: row.carbs != null ? Number(row.carbs) : null,
    fat: row.fat != null ? Number(row.fat) : null,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function shiftDateKey(dateKey: string, deltaDays: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return formatDateKey(date);
}

function computeStreaks(dailyDates: string[]): CheckinStreakInfo {
  if (dailyDates.length === 0) return { current: 0, best: 0 };

  const sorted = [...new Set(dailyDates)].sort();
  const dailySet = new Set(sorted);

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of sorted) {
    if (prev && shiftDateKey(prev, 1) === date) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = date;
  }

  const today = formatDateKey(new Date());
  const yesterday = shiftDateKey(today, -1);
  const latest = sorted[sorted.length - 1];
  if (latest !== today && latest !== yesterday) {
    return { current: 0, best };
  }

  let current = 0;
  let cursor = latest;
  while (dailySet.has(cursor)) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return { current, best };
}

function buildHeatmapDay(dateKey: string, state: CheckinTodayState): CheckinHeatmapDay {
  const score =
    Number(state.daily) +
    Number(state.workout) +
    Number(state.diet) +
    Number(state.weight);
  return { date: dateKey, ...state, score };
}

export type FitnessPlanDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  query: any;
};

export class FitnessPlanDbService {
  constructor(private readonly db: FitnessPlanDrizzleDb) {}
  async ensureSystemExercisesSeeded() {
    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(exercises)
      .where(isNull(exercises.userId));

    if ((count ?? 0) > 0) {
      return;
    }

    await this.db.insert(exercises).values(
      systemExercises.map((item) => ({
        userId: null,
        name: item.name,
        type: item.type,
        bodyPart: item.bodyPart ?? null,
        equipment: item.equipment ?? null,
        cardioType: item.cardioType ?? null,
        description: item.description ?? null,
      })),
    );
  }

  async ensureSystemFoodsSeeded() {
    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(foodItems)
      .where(isNull(foodItems.userId));

    if ((count ?? 0) > 0) {
      return;
    }

    await this.db.insert(foodItems).values(
      systemFoods.map((item) => ({
        userId: null,
        name: item.name,
        calories: item.calories,
        protein: item.protein != null ? String(item.protein) : null,
        carbs: item.carbs != null ? String(item.carbs) : null,
        fat: item.fat != null ? String(item.fat) : null,
      })),
    );
  }

  async getOrCreateProfile(userId: string) {
    const existing = await this.db.query.fitnessProfiles.findFirst({
      where: eq(fitnessProfiles.userId, userId),
    });

    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(fitnessProfiles)
      .values({
        userId,
        goal: 'maintain',
        weightUnit: 'kg',
        dailyCalorieGoal: 2000,
      })
      .returning();

    return created;
  }

  async updateProfile(userId: string, data: FitnessProfileFormData) {
    await this.getOrCreateProfile(userId);

    const patch: Partial<typeof fitnessProfiles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.goal) patch.goal = data.goal as FitnessGoal;
    if (data.weightUnit) patch.weightUnit = data.weightUnit;
    if (data.dailyCalorieGoal != null) patch.dailyCalorieGoal = data.dailyCalorieGoal;
    if (data.currentWeight !== undefined) {
      patch.currentWeight =
        data.currentWeight == null ? null : String(data.currentWeight);
    }

    const [updated] = await this.db
      .update(fitnessProfiles)
      .set(patch)
      .where(eq(fitnessProfiles.userId, userId))
      .returning();

    return updated;
  }

  async getTodayCheckins(userId: string, date = new Date()): Promise<CheckinTodayState> {
    const dateKey = formatDateKey(date);
    const rows = await this.db
      .select()
      .from(dailyCheckins)
      .where(
        and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.checkinDate, dateKey)),
      );

    const state: CheckinTodayState = {
      daily: false,
      workout: false,
      diet: false,
      weight: false,
    };

    for (const row of rows) {
      const type = row.type as CheckinType;
      if (type in state) state[type] = true;
    }

    return state;
  }

  async listExercises(
    userId: string,
    filters: { search?: string; type?: string; bodyPart?: string } = {},
  ): Promise<ExerciseRecord[]> {
    await this.ensureSystemExercisesSeeded();

    const conditions = [or(isNull(exercises.userId), eq(exercises.userId, userId))];

    if (filters.type) conditions.push(eq(exercises.type, filters.type));
    if (filters.bodyPart) conditions.push(eq(exercises.bodyPart, filters.bodyPart));
    if (filters.search?.trim()) {
      conditions.push(ilike(exercises.name, `%${filters.search.trim()}%`));
    }

    const rows = await this.db
      .select()
      .from(exercises)
      .where(and(...conditions))
      .orderBy(asc(exercises.type), asc(exercises.name));

    return rows.map(mapExercise);
  }

  async createExercise(userId: string, data: ExerciseFormData) {
    const [created] = await this.db
      .insert(exercises)
      .values({
        userId,
        name: data.name.trim(),
        type: data.type,
        bodyPart: data.bodyPart ?? null,
        equipment: data.equipment ?? null,
        cardioType: data.cardioType ?? null,
        description: data.description ?? null,
      })
      .returning();

    return mapExercise(created);
  }

  async updateExercise(userId: string, exerciseId: number, data: ExerciseFormData) {
    const existing = await this.db.query.exercises.findFirst({
      where: and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
    });

    if (!existing) return null;

    const [updated] = await this.db
      .update(exercises)
      .set({
        name: data.name.trim(),
        type: data.type,
        bodyPart: data.bodyPart ?? null,
        equipment: data.equipment ?? null,
        cardioType: data.cardioType ?? null,
        description: data.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, exerciseId))
      .returning();

    return mapExercise(updated);
  }

  async deleteExercise(userId: string, exerciseId: number) {
    const existing = await this.db.query.exercises.findFirst({
      where: and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
    });

    if (!existing) return false;

    await this.db.delete(exercises).where(eq(exercises.id, exerciseId));
    return true;
  }

  async listPlans(userId: string, status: WorkoutPlanStatus = 'active') {
    const rows = await this.db
      .select({
        id: workoutPlans.id,
        userId: workoutPlans.userId,
        name: workoutPlans.name,
        description: workoutPlans.description,
        goalTags: workoutPlans.goalTags,
        status: workoutPlans.status,
        isTemplate: workoutPlans.isTemplate,
        sourceTemplateId: workoutPlans.sourceTemplateId,
        createdAt: workoutPlans.createdAt,
        updatedAt: workoutPlans.updatedAt,
        itemCount: sql<number>`cast(count(${workoutPlanItems.id}) as int)`,
      })
      .from(workoutPlans)
      .leftJoin(workoutPlanItems, eq(workoutPlans.id, workoutPlanItems.planId))
      .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.status, status)))
      .groupBy(workoutPlans.id)
      .orderBy(desc(workoutPlans.updatedAt));

    return rows.map((row) => ({
      ...row,
      goalTags: row.goalTags ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as WorkoutPlanRecord[];
  }

  async getPlanDetail(userId: string, planId: number): Promise<WorkoutPlanDetail | null> {
    const plan = await this.db.query.workoutPlans.findFirst({
      where: and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)),
    });

    if (!plan) return null;

    const itemRows = await this.db
      .select({
        id: workoutPlanItems.id,
        planId: workoutPlanItems.planId,
        exerciseId: workoutPlanItems.exerciseId,
        sortOrder: workoutPlanItems.sortOrder,
        targetSets: workoutPlanItems.targetSets,
        targetReps: workoutPlanItems.targetReps,
        targetWeight: workoutPlanItems.targetWeight,
        restSeconds: workoutPlanItems.restSeconds,
        targetDurationMinutes: workoutPlanItems.targetDurationMinutes,
        targetDistance: workoutPlanItems.targetDistance,
        targetCalories: workoutPlanItems.targetCalories,
        exercise: exercises,
      })
      .from(workoutPlanItems)
      .innerJoin(exercises, eq(workoutPlanItems.exerciseId, exercises.id))
      .where(eq(workoutPlanItems.planId, planId))
      .orderBy(asc(workoutPlanItems.sortOrder), asc(workoutPlanItems.id));

    return {
      id: plan.id,
      userId: plan.userId,
      name: plan.name,
      description: plan.description,
      goalTags: plan.goalTags ?? [],
      status: plan.status as WorkoutPlanStatus,
      isTemplate: plan.isTemplate,
      sourceTemplateId: plan.sourceTemplateId,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      items: itemRows.map((row) => ({
        id: row.id,
        planId: row.planId,
        exerciseId: row.exerciseId,
        sortOrder: row.sortOrder,
        targetSets: row.targetSets ?? undefined,
        targetReps: row.targetReps ?? undefined,
        targetWeight: row.targetWeight != null ? Number(row.targetWeight) : undefined,
        restSeconds: row.restSeconds ?? undefined,
        targetDurationMinutes: row.targetDurationMinutes ?? undefined,
        targetDistance: row.targetDistance != null ? Number(row.targetDistance) : undefined,
        targetCalories: row.targetCalories ?? undefined,
        exercise: mapExercise(row.exercise),
      })),
    };
  }

  private async resolveExerciseId(userId: string, item: PlanItemInput) {
    if (item.exerciseId) return item.exerciseId;

    if (!item.exerciseName) {
      throw new Error('动作缺少 exerciseId 或 exerciseName');
    }

    await this.ensureSystemExercisesSeeded();
    const found = await this.db.query.exercises.findFirst({
      where: and(
        eq(exercises.name, item.exerciseName),
        or(isNull(exercises.userId), eq(exercises.userId, userId)),
      ),
    });

    if (!found) throw new Error(`未找到动作：${item.exerciseName}`);
    return found.id;
  }

  private async insertPlanItems(planId: number, userId: string, items: PlanItemInput[]) {
    if (items.length === 0) return;

    const values = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const exerciseId = await this.resolveExerciseId(userId, item);
      values.push({
        planId,
        exerciseId,
        sortOrder: index,
        targetSets: item.targetSets ?? null,
        targetReps: item.targetReps ?? null,
        targetWeight: item.targetWeight != null ? String(item.targetWeight) : null,
        restSeconds: item.restSeconds ?? 90,
        targetDurationMinutes: item.targetDurationMinutes ?? null,
        targetDistance: item.targetDistance != null ? String(item.targetDistance) : null,
        targetCalories: item.targetCalories ?? null,
      });
    }

    await this.db.insert(workoutPlanItems).values(values);
  }

  async createPlan(userId: string, data: WorkoutPlanFormData, items: PlanItemInput[] = []) {
    const [plan] = await this.db
      .insert(workoutPlans)
      .values({
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        goalTags: data.goalTags ?? [],
        status: 'active',
      })
      .returning();

    await this.insertPlanItems(plan.id, userId, items);
    return this.getPlanDetail(userId, plan.id);
  }

  async updatePlan(userId: string, planId: number, data: Partial<WorkoutPlanFormData> & { status?: WorkoutPlanStatus }) {
    const existing = await this.db.query.workoutPlans.findFirst({
      where: and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)),
    });

    if (!existing) return null;

    const [updated] = await this.db
      .update(workoutPlans)
      .set({
        name: data.name?.trim() ?? existing.name,
        description:
          data.description !== undefined
            ? data.description?.trim() || null
            : existing.description,
        goalTags: data.goalTags ?? existing.goalTags,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(workoutPlans.id, planId))
      .returning();

    return {
      ...updated,
      goalTags: updated.goalTags ?? [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    } as WorkoutPlanRecord;
  }

  async deletePlan(userId: string, planId: number) {
    const result = await this.db
      .delete(workoutPlans)
      .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
      .returning({ id: workoutPlans.id });

    return result.length > 0;
  }

  async copyPlan(userId: string, planId: number) {
    const source = await this.getPlanDetail(userId, planId);
    if (!source) return null;

    return this.createPlan(
      userId,
      {
        name: `${source.name}（副本）`,
        description: source.description ?? undefined,
        goalTags: source.goalTags,
      },
      source.items.map((item) => ({
        exerciseId: item.exerciseId,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetWeight: item.targetWeight,
        restSeconds: item.restSeconds,
        targetDurationMinutes: item.targetDurationMinutes,
        targetDistance: item.targetDistance,
        targetCalories: item.targetCalories,
      })),
    );
  }

  async setPlanItems(userId: string, planId: number, items: PlanItemInput[]) {
    const existing = await this.db.query.workoutPlans.findFirst({
      where: and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)),
    });

    if (!existing) return null;

    await this.db.delete(workoutPlanItems).where(eq(workoutPlanItems.planId, planId));
    await this.insertPlanItems(planId, userId, items);
    await this.db
      .update(workoutPlans)
      .set({ updatedAt: new Date() })
      .where(eq(workoutPlans.id, planId));

    return this.getPlanDetail(userId, planId);
  }

  async copyFromTemplate(userId: string, templateId: string) {
    const template = PLAN_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return null;

    return this.createPlan(
      userId,
      {
        name: template.name,
        description: template.description,
        goalTags: template.goalTags,
      },
      template.items,
    );
  }

  async copyTemplateGroup(userId: string, groupId: string) {
    const templates =
      groupId === 'push-pull-legs'
        ? PLAN_TEMPLATES.filter((item) => item.id.startsWith('push-pull-legs-'))
        : groupId === 'upper-lower'
          ? PLAN_TEMPLATES.filter((item) => item.id.startsWith('upper-lower-'))
          : PLAN_TEMPLATES.filter((item) => item.id === 'cardio-strength-mix');

    const created = [];
    for (const template of templates) {
      const plan = await this.copyFromTemplate(userId, template.id);
      if (plan) created.push(plan);
    }
    return created;
  }

  async getOrCreateActiveScheduleTemplate(userId: string): Promise<ScheduleTemplateRecord> {
    const existing = await this.db.query.scheduleTemplates.findFirst({
      where: and(
        eq(scheduleTemplates.userId, userId),
        eq(scheduleTemplates.isActive, true),
      ),
    });

    if (existing) return mapScheduleTemplate(existing);

    const [created] = await this.db
      .insert(scheduleTemplates)
      .values({
        userId,
        name: '默认周循环',
        isActive: true,
        cycleWeeks: 4,
        weekPattern: emptyWeekPattern(),
      })
      .returning();

    return mapScheduleTemplate(created);
  }

  async updateScheduleTemplate(userId: string, input: ScheduleTemplateInput) {
    const current = await this.getOrCreateActiveScheduleTemplate(userId);

    const [updated] = await this.db
      .update(scheduleTemplates)
      .set({
        name: input.name?.trim() || current.name,
        cycleWeeks: input.cycleWeeks ?? current.cycleWeeks,
        weekPattern: input.weekPattern
          ? { ...current.weekPattern, ...input.weekPattern }
          : current.weekPattern,
        updatedAt: new Date(),
      })
      .where(and(eq(scheduleTemplates.id, current.id), eq(scheduleTemplates.userId, userId)))
      .returning();

    return mapScheduleTemplate(updated);
  }

  async getMonthSchedule(userId: string, monthKey: string): Promise<MonthSchedulePayload> {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const anchor = new Date(year, month - 1, 1);
    const gridDates = getMonthViewDates(anchor, 1);
    const startDate = formatCalendarDate(gridDates[0]);
    const endDate = formatCalendarDate(gridDates[gridDates.length - 1]);

    const template = await this.getOrCreateActiveScheduleTemplate(userId);

    const [overrides, checkinRows, dietRows, workoutRows, planRows] = await Promise.all([
      db
        .select()
        .from(scheduleOverrides)
        .where(
          and(
            eq(scheduleOverrides.userId, userId),
            gte(scheduleOverrides.scheduleDate, startDate),
            lte(scheduleOverrides.scheduleDate, endDate),
          ),
        ),
      db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, userId),
            gte(dailyCheckins.checkinDate, startDate),
            lte(dailyCheckins.checkinDate, endDate),
          ),
        ),
      db
        .select({ logDate: dietLogs.logDate })
        .from(dietLogs)
        .where(
          and(
            eq(dietLogs.userId, userId),
            gte(dietLogs.logDate, startDate),
            lte(dietLogs.logDate, endDate),
          ),
        ),
      db
        .select({
          endedAt: workoutSessions.endedAt,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'completed'),
            gte(workoutSessions.startedAt, new Date(`${startDate}T00:00:00`)),
            lte(workoutSessions.startedAt, new Date(`${endDate}T23:59:59`)),
          ),
        ),
      db
        .select({ id: workoutPlans.id, name: workoutPlans.name })
        .from(workoutPlans)
        .where(eq(workoutPlans.userId, userId)),
    ]);

    const overrideMap = new Map(
      overrides.map((row) => [String(row.scheduleDate), row]),
    );
    const planNameMap = new Map(planRows.map((row) => [row.id, row.name]));

    const badgeMap = new Map<string, { workout: boolean; diet: boolean; daily: boolean }>();
    for (const date of gridDates) {
      badgeMap.set(formatCalendarDate(date), { workout: false, diet: false, daily: false });
    }
    for (const row of checkinRows) {
      const key = String(row.checkinDate);
      const badges = badgeMap.get(key) ?? { workout: false, diet: false, daily: false };
      if (row.type === 'workout') badges.workout = true;
      if (row.type === 'diet') badges.diet = true;
      if (row.type === 'daily') badges.daily = true;
      badgeMap.set(key, badges);
    }
    for (const row of dietRows) {
      const key = String(row.logDate);
      const badges = badgeMap.get(key) ?? { workout: false, diet: false, daily: false };
      badges.diet = true;
      badgeMap.set(key, badges);
    }
    for (const row of workoutRows) {
      const when = row.endedAt ?? row.startedAt;
      if (!when) continue;
      const key = formatDateKey(new Date(when));
      const badges = badgeMap.get(key) ?? { workout: false, diet: false, daily: false };
      badges.workout = true;
      badgeMap.set(key, badges);
    }

    const days: ScheduleDayInfo[] = gridDates.map((date) => {
      const dateKey = formatCalendarDate(date);
      const override = overrideMap.get(dateKey);
      const weekKey = dateToWeekDayKey(date);
      const patternValue = template.weekPattern[weekKey];

      let planId: number | null = null;
      let isRest = false;
      let isOverride = false;

      if (override) {
        isOverride = true;
        isRest = override.isRest;
        planId = override.planId;
      } else if (patternValue === 'rest') {
        isRest = true;
      } else if (typeof patternValue === 'number') {
        planId = patternValue;
      }

      return {
        date: dateKey,
        planId,
        planName: planId ? planNameMap.get(planId) ?? '未知计划' : null,
        isRest,
        isOverride,
        badges: badgeMap.get(dateKey) ?? { workout: false, diet: false, daily: false },
      };
    });

    return { month: monthKey, template, days };
  }

  async setScheduleOverride(userId: string, input: ScheduleOverrideInput) {
    if (input.clear) {
      await this.db
        .delete(scheduleOverrides)
        .where(
          and(
            eq(scheduleOverrides.userId, userId),
            eq(scheduleOverrides.scheduleDate, input.date),
          ),
        );
      return { success: true };
    }

    const existing = await this.db.query.scheduleOverrides.findFirst({
      where: and(
        eq(scheduleOverrides.userId, userId),
        eq(scheduleOverrides.scheduleDate, input.date),
      ),
    });

    const payload = {
      planId: input.isRest ? null : input.planId ?? null,
      isRest: Boolean(input.isRest),
      updatedAt: new Date(),
    };

    if (existing) {
      await this.db
        .update(scheduleOverrides)
        .set(payload)
        .where(eq(scheduleOverrides.id, existing.id));
    } else {
      await this.db.insert(scheduleOverrides).values({
        userId,
        scheduleDate: input.date,
        ...payload,
      });
    }

    return { success: true };
  }

  async listSessions(userId: string, limit = 30): Promise<WorkoutSessionListItem[]> {
    const rows = await this.db
      .select({
        id: workoutSessions.id,
        planId: workoutSessions.planId,
        planName: workoutPlans.name,
        status: workoutSessions.status,
        startedAt: workoutSessions.startedAt,
        endedAt: workoutSessions.endedAt,
        durationSeconds: workoutSessions.durationSeconds,
      })
      .from(workoutSessions)
      .leftJoin(workoutPlans, eq(workoutSessions.planId, workoutPlans.id))
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      planId: row.planId,
      planName: row.planName,
      status: row.status as WorkoutSessionListItem['status'],
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt?.toISOString() ?? null,
      durationSeconds: row.durationSeconds,
    }));
  }

  async getActiveSession(userId: string): Promise<WorkoutSessionDetail | null> {
    const [active] = await this.db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'in_progress'),
        ),
      )
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1);

    if (!active) return null;
    return this.getSessionDetail(userId, active.id);
  }

  async getSessionDetail(userId: string, sessionId: number): Promise<WorkoutSessionDetail | null> {
    const session = await this.db.query.workoutSessions.findFirst({
      where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)),
    });

    if (!session) return null;

    const plan = session.planId
      ? await this.db.query.workoutPlans.findFirst({
          where: eq(workoutPlans.id, session.planId),
        })
      : null;

    const planItemRestMap = new Map<number, number>();
    if (session.planId) {
      const planItems = await this.db
        .select({
          exerciseId: workoutPlanItems.exerciseId,
          restSeconds: workoutPlanItems.restSeconds,
        })
        .from(workoutPlanItems)
        .where(eq(workoutPlanItems.planId, session.planId));
      for (const item of planItems) {
        planItemRestMap.set(item.exerciseId, item.restSeconds ?? 90);
      }
    }

    const itemRows = await this.db
      .select({
        id: workoutSessionItems.id,
        sessionId: workoutSessionItems.sessionId,
        exerciseId: workoutSessionItems.exerciseId,
        sortOrder: workoutSessionItems.sortOrder,
        exercise: exercises,
      })
      .from(workoutSessionItems)
      .innerJoin(exercises, eq(workoutSessionItems.exerciseId, exercises.id))
      .where(eq(workoutSessionItems.sessionId, sessionId))
      .orderBy(asc(workoutSessionItems.sortOrder), asc(workoutSessionItems.id));

    const items: WorkoutSessionDetail['items'] = [];
    for (const itemRow of itemRows) {
      const setRows = await this.db
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.sessionItemId, itemRow.id))
        .orderBy(asc(workoutSets.setNumber));

      items.push({
        id: itemRow.id,
        sessionId: itemRow.sessionId,
        exerciseId: itemRow.exerciseId,
        sortOrder: itemRow.sortOrder,
        restSeconds: planItemRestMap.get(itemRow.exerciseId) ?? 90,
        exercise: mapExercise(itemRow.exercise),
        sets: setRows.map((set) => ({
          id: set.id,
          sessionItemId: set.sessionItemId,
          setNumber: set.setNumber,
          weight: set.weight != null ? Number(set.weight) : null,
          reps: set.reps,
          durationMinutes: set.durationMinutes,
          distance: set.distance != null ? Number(set.distance) : null,
          calories: set.calories,
          isCompleted: set.isCompleted,
        })),
      });
    }

    return {
      id: session.id,
      userId: session.userId,
      planId: session.planId,
      planName: plan?.name ?? null,
      status: session.status as WorkoutSessionDetail['status'],
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      notes: session.notes,
      summaryJson: session.summaryJson ?? null,
      items,
    };
  }

  private computeSessionSummary(items: WorkoutSessionDetail['items']): WorkoutSessionSummary {
    let totalSets = 0;
    let completedSets = 0;
    let strengthVolume = 0;
    let cardioMinutes = 0;

    for (const item of items) {
      for (const set of item.sets) {
        totalSets += 1;
        if (!set.isCompleted) continue;
        completedSets += 1;
        if (item.exercise.type === 'cardio') {
          cardioMinutes += set.durationMinutes ?? 0;
        } else {
          strengthVolume += (set.weight ?? 0) * (set.reps ?? 0);
        }
      }
    }

    return { totalSets, completedSets, strengthVolume, cardioMinutes };
  }

  private async ensureWorkoutCheckin(userId: string, sessionId: number, dateKey: string) {
    const existing = await this.db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, userId),
        eq(dailyCheckins.checkinDate, dateKey),
        eq(dailyCheckins.type, 'workout'),
      ),
    });

    if (existing) return;

    await this.db.insert(dailyCheckins).values({
      userId,
      checkinDate: dateKey,
      type: 'workout',
      refId: sessionId,
    });
  }

  async resolveTodayPlanId(userId: string): Promise<number | null> {
    const monthKey = formatDateKey(new Date()).slice(0, 7);
    const schedule = await this.getMonthSchedule(userId, monthKey);
    const today = formatDateKey(new Date());
    const day = schedule.days.find((item) => item.date === today);
    if (!day || day.isRest || !day.planId) return null;
    return day.planId;
  }

  async startSession(userId: string, input: StartWorkoutInput) {
    const active = await this.getActiveSession(userId);
    if (active) {
      throw new Error('已有进行中的训练，请先完成或放弃');
    }

    const planId = input.empty ? null : input.planId ?? null;

    const [session] = await this.db
      .insert(workoutSessions)
      .values({
        userId,
        planId,
        status: 'in_progress',
      })
      .returning();

    if (planId) {
      const plan = await this.getPlanDetail(userId, planId);
      if (plan) {
        for (const item of plan.items) {
          const [sessionItem] = await this.db
            .insert(workoutSessionItems)
            .values({
              sessionId: session.id,
              exerciseId: item.exerciseId!,
              sortOrder: item.sortOrder,
            })
            .returning();

          const isCardio = item.exercise?.type === 'cardio';
          const setCount = isCardio ? 1 : Math.max(item.targetSets ?? 3, 1);

          for (let setNumber = 1; setNumber <= setCount; setNumber += 1) {
            await this.db.insert(workoutSets).values({
              sessionItemId: sessionItem.id,
              setNumber,
              weight: item.targetWeight != null ? String(item.targetWeight) : null,
              reps: item.targetReps ?? null,
              durationMinutes: item.targetDurationMinutes ?? null,
              distance: item.targetDistance != null ? String(item.targetDistance) : null,
              calories: item.targetCalories ?? null,
              isCompleted: false,
            });
          }
        }
      }
    }

    return this.getSessionDetail(userId, session.id);
  }

  async addSessionExercise(userId: string, sessionId: number, exerciseId: number) {
    const session = await this.getSessionDetail(userId, sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('训练会话不存在或已结束');
    }

    await this.ensureSystemExercisesSeeded();
    const exercise = await this.db.query.exercises.findFirst({
      where: and(
        eq(exercises.id, exerciseId),
        or(isNull(exercises.userId), eq(exercises.userId, userId)),
      ),
    });
    if (!exercise) throw new Error('动作不存在');

    const sortOrder = session.items.length;
    const [sessionItem] = await this.db
      .insert(workoutSessionItems)
      .values({ sessionId, exerciseId, sortOrder })
      .returning();

    const isCardio = exercise.type === 'cardio';
    const setCount = isCardio ? 1 : 3;
    for (let setNumber = 1; setNumber <= setCount; setNumber += 1) {
      await this.db.insert(workoutSets).values({
        sessionItemId: sessionItem.id,
        setNumber,
        isCompleted: false,
      });
    }

    return this.getSessionDetail(userId, sessionId);
  }

  async addWorkoutSet(userId: string, sessionItemId: number) {
    const item = await this.db.query.workoutSessionItems.findFirst({
      where: eq(workoutSessionItems.id, sessionItemId),
    });
    if (!item) throw new Error('训练项不存在');

    const session = await this.getSessionDetail(userId, item.sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('训练会话不存在或已结束');
    }

    const maxSet = await this.db
      .select({ max: sql<number>`coalesce(max(${workoutSets.setNumber}), 0)` })
      .from(workoutSets)
      .where(eq(workoutSets.sessionItemId, sessionItemId));

    const nextNumber = (maxSet[0]?.max ?? 0) + 1;
    const [created] = await this.db
      .insert(workoutSets)
      .values({ sessionItemId, setNumber: nextNumber, isCompleted: false })
      .returning();

    return {
      id: created.id,
      sessionItemId: created.sessionItemId,
      setNumber: created.setNumber,
      weight: null,
      reps: null,
      durationMinutes: null,
      distance: null,
      calories: null,
      isCompleted: false,
    } satisfies WorkoutSetRecord;
  }

  async updateWorkoutSet(userId: string, setId: number, input: UpdateWorkoutSetInput) {
    const setRow = await this.db.query.workoutSets.findFirst({
      where: eq(workoutSets.id, setId),
    });
    if (!setRow) throw new Error('组记录不存在');

    const item = await this.db.query.workoutSessionItems.findFirst({
      where: eq(workoutSessionItems.id, setRow.sessionItemId),
    });
    if (!item) throw new Error('训练项不存在');

    const session = await this.getSessionDetail(userId, item.sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('训练会话不存在或已结束');
    }

    const patch: Partial<typeof workoutSets.$inferInsert> = {};
    if (input.weight !== undefined) patch.weight = input.weight == null ? null : String(input.weight);
    if (input.reps !== undefined) patch.reps = input.reps;
    if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
    if (input.distance !== undefined) {
      patch.distance = input.distance == null ? null : String(input.distance);
    }
    if (input.calories !== undefined) patch.calories = input.calories;
    if (input.isCompleted !== undefined) patch.isCompleted = input.isCompleted;

    const [updated] = await this.db
      .update(workoutSets)
      .set(patch)
      .where(eq(workoutSets.id, setId))
      .returning();

    return {
      id: updated.id,
      sessionItemId: updated.sessionItemId,
      setNumber: updated.setNumber,
      weight: updated.weight != null ? Number(updated.weight) : null,
      reps: updated.reps,
      durationMinutes: updated.durationMinutes,
      distance: updated.distance != null ? Number(updated.distance) : null,
      calories: updated.calories,
      isCompleted: updated.isCompleted,
    } satisfies WorkoutSetRecord;
  }

  async updateSessionNotes(userId: string, sessionId: number, notes: string | null) {
    const session = await this.getSessionDetail(userId, sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('训练会话不存在或已结束');
    }

    await this.db
      .update(workoutSessions)
      .set({ notes, updatedAt: new Date() })
      .where(eq(workoutSessions.id, sessionId));

    return this.getSessionDetail(userId, sessionId);
  }

  async completeSession(userId: string, sessionId: number, input: CompleteWorkoutInput) {
    const session = await this.getSessionDetail(userId, sessionId);
    if (!session) throw new Error('训练会话不存在');
    if (session.status !== 'in_progress') throw new Error('训练已结束');

    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000),
    );
    const summary = this.computeSessionSummary(session.items);

    await this.db
      .update(workoutSessions)
      .set({
        status: input.status,
        endedAt,
        durationSeconds,
        notes: input.notes ?? session.notes,
        summaryJson: summary as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));

    if (input.status === 'completed') {
      await this.ensureWorkoutCheckin(userId, sessionId, formatDateKey(new Date()));
    }

    return this.getSessionDetail(userId, sessionId);
  }

  async listFoodItems(
    userId: string,
    filters: { search?: string } = {},
  ): Promise<FoodItemRecord[]> {
    await this.ensureSystemFoodsSeeded();

    const conditions = [
      or(isNull(foodItems.userId), eq(foodItems.userId, userId)),
    ];

    if (filters.search?.trim()) {
      conditions.push(ilike(foodItems.name, `%${filters.search.trim()}%`));
    }

    const rows = await this.db
      .select()
      .from(foodItems)
      .where(and(...conditions))
      .orderBy(asc(foodItems.name))
      .limit(100);

    return rows.map(mapFoodItem);
  }

  async createFoodItem(userId: string, data: FoodItemFormData) {
    const [created] = await this.db
      .insert(foodItems)
      .values({
        userId,
        name: data.name.trim(),
        calories: data.calories,
        protein: data.protein != null ? String(data.protein) : null,
        carbs: data.carbs != null ? String(data.carbs) : null,
        fat: data.fat != null ? String(data.fat) : null,
      })
      .returning();

    return mapFoodItem(created);
  }

  async getDietDay(userId: string, logDate: string): Promise<DietDayPayload> {
    const profile = await this.getOrCreateProfile(userId);
    const log = await this.db.query.dietLogs.findFirst({
      where: and(eq(dietLogs.userId, userId), eq(dietLogs.logDate, logDate)),
    });

    if (!log) {
      return {
        logDate,
        logId: null,
        entries: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        calorieGoal: profile.dailyCalorieGoal,
      };
    }

    const entryRows = await this.db
      .select()
      .from(dietLogEntries)
      .where(eq(dietLogEntries.dietLogId, log.id))
      .orderBy(asc(dietLogEntries.sortOrder), asc(dietLogEntries.id));

    const entries = entryRows.map(mapDietEntry);
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + (entry.protein ?? 0),
        carbs: acc.carbs + (entry.carbs ?? 0),
        fat: acc.fat + (entry.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      logDate,
      logId: log.id,
      entries,
      totals,
      calorieGoal: profile.dailyCalorieGoal,
    };
  }

  private async getOrCreateDietLog(userId: string, logDate: string) {
    const existing = await this.db.query.dietLogs.findFirst({
      where: and(eq(dietLogs.userId, userId), eq(dietLogs.logDate, logDate)),
    });

    if (existing) return existing;

    const [created] = await this.db
      .insert(dietLogs)
      .values({ userId, logDate })
      .returning();

    return created;
  }

  private async ensureDietCheckin(userId: string, dietLogId: number, dateKey: string) {
    const existing = await this.db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, userId),
        eq(dailyCheckins.checkinDate, dateKey),
        eq(dailyCheckins.type, 'diet'),
      ),
    });

    if (existing) return;

    await this.db.insert(dailyCheckins).values({
      userId,
      checkinDate: dateKey,
      type: 'diet',
      refId: dietLogId,
    });
  }

  async addDietEntry(userId: string, input: DietEntryInput) {
    if (!input.foodName?.trim()) throw new Error('名称不能为空');

    const calories = input.calories ?? 0;
    if (!Number.isFinite(calories) || calories < 0) {
      throw new Error('热量无效');
    }

    const log = await this.getOrCreateDietLog(userId, input.logDate);
    const hadEntries = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(dietLogEntries)
      .where(eq(dietLogEntries.dietLogId, log.id));

    const sortOrder = hadEntries[0]?.count ?? 0;

    await this.db.insert(dietLogEntries).values({
      dietLogId: log.id,
      mealType: input.mealType,
      foodName: input.foodName.trim(),
      foodItemId: input.foodItemId ?? null,
      calories,
      protein: input.protein != null ? String(input.protein) : null,
      carbs: input.carbs != null ? String(input.carbs) : null,
      fat: input.fat != null ? String(input.fat) : null,
      imageUrl: input.imageUrl ?? null,
      sortOrder,
    });

    if ((hadEntries[0]?.count ?? 0) === 0) {
      await this.ensureDietCheckin(userId, log.id, input.logDate);
    }

    return this.getDietDay(userId, input.logDate);
  }

  async updateDietEntry(userId: string, entryId: number, input: DietEntryUpdateInput) {
    const entry = await this.db.query.dietLogEntries.findFirst({
      where: eq(dietLogEntries.id, entryId),
    });
    if (!entry) throw new Error('饮食记录不存在');

    const log = await this.db.query.dietLogs.findFirst({
      where: and(eq(dietLogs.id, entry.dietLogId), eq(dietLogs.userId, userId)),
    });
    if (!log) throw new Error('无权修改该记录');

    const patch: Partial<typeof dietLogEntries.$inferInsert> = {};
    if (input.mealType) patch.mealType = input.mealType;
    if (input.foodName != null) patch.foodName = input.foodName.trim();
    if (input.calories != null) patch.calories = input.calories;
    if (input.protein !== undefined) {
      patch.protein = input.protein == null ? null : String(input.protein);
    }
    if (input.carbs !== undefined) {
      patch.carbs = input.carbs == null ? null : String(input.carbs);
    }
    if (input.fat !== undefined) {
      patch.fat = input.fat == null ? null : String(input.fat);
    }
    if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl;

    await this.db.update(dietLogEntries).set(patch).where(eq(dietLogEntries.id, entryId));

    const dateKey =
      typeof log.logDate === 'string' ? log.logDate : formatDateKey(new Date(log.logDate));
    return this.getDietDay(userId, dateKey);
  }

  async deleteDietEntry(userId: string, entryId: number) {
    const entry = await this.db.query.dietLogEntries.findFirst({
      where: eq(dietLogEntries.id, entryId),
    });
    if (!entry) throw new Error('饮食记录不存在');

    const log = await this.db.query.dietLogs.findFirst({
      where: and(eq(dietLogs.id, entry.dietLogId), eq(dietLogs.userId, userId)),
    });
    if (!log) throw new Error('无权删除该记录');

    await this.db.delete(dietLogEntries).where(eq(dietLogEntries.id, entryId));

    const dateKey =
      typeof log.logDate === 'string' ? log.logDate : formatDateKey(new Date(log.logDate));
    return this.getDietDay(userId, dateKey);
  }

  async createManualCheckin(userId: string, input: ManualCheckinInput) {
    const dateKey = input.date ?? formatDateKey(new Date());
    if (input.type !== 'daily' && input.type !== 'weight') {
      throw new Error('仅支持手动综合日打卡或体重打卡');
    }

    const existing = await this.db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, userId),
        eq(dailyCheckins.checkinDate, dateKey),
        eq(dailyCheckins.type, input.type),
      ),
    });

    if (!existing) {
      await this.db.insert(dailyCheckins).values({
        userId,
        checkinDate: dateKey,
        type: input.type,
      });
    }

    if (input.type === 'weight' && input.currentWeight !== undefined) {
      await this.updateProfile(userId, { currentWeight: input.currentWeight });
    }

    return this.getTodayCheckins(userId, new Date(`${dateKey}T12:00:00`));
  }

  async removeManualCheckin(userId: string, dateKey: string, type: 'daily' | 'weight') {
    await this.db
      .delete(dailyCheckins)
      .where(
        and(
          eq(dailyCheckins.userId, userId),
          eq(dailyCheckins.checkinDate, dateKey),
          eq(dailyCheckins.type, type),
        ),
      );

    return this.getTodayCheckins(userId, new Date(`${dateKey}T12:00:00`));
  }

  async getCheckinHeatmap(userId: string, weeks = 12): Promise<CheckinHeatmapPayload> {
    const endDate = formatDateKey(new Date());
    const startDate = shiftDateKey(endDate, -(weeks * 7 - 1));

    const [allDailyRows, checkinRows, dietRows, workoutRows] = await Promise.all([
      db
        .select({ checkinDate: dailyCheckins.checkinDate })
        .from(dailyCheckins)
        .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.type, 'daily'))),
      db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, userId),
            gte(dailyCheckins.checkinDate, startDate),
            lte(dailyCheckins.checkinDate, endDate),
          ),
        ),
      db
        .select({ logDate: dietLogs.logDate })
        .from(dietLogs)
        .where(
          and(
            eq(dietLogs.userId, userId),
            gte(dietLogs.logDate, startDate),
            lte(dietLogs.logDate, endDate),
          ),
        ),
      db
        .select({
          endedAt: workoutSessions.endedAt,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'completed'),
            gte(workoutSessions.startedAt, new Date(`${startDate}T00:00:00`)),
            lte(workoutSessions.startedAt, new Date(`${endDate}T23:59:59`)),
          ),
        ),
    ]);

    const streak = computeStreaks(allDailyRows.map((row) => String(row.checkinDate)));

    const stateMap = new Map<string, CheckinTodayState>();
    let cursor = startDate;
    while (cursor <= endDate) {
      stateMap.set(cursor, {
        daily: false,
        workout: false,
        diet: false,
        weight: false,
      });
      cursor = shiftDateKey(cursor, 1);
    }

    for (const row of checkinRows) {
      const key = String(row.checkinDate);
      const state = stateMap.get(key);
      if (!state) continue;
      const type = row.type as CheckinType;
      if (type in state) state[type] = true;
    }

    for (const row of dietRows) {
      const key = String(row.logDate);
      const state = stateMap.get(key);
      if (state) state.diet = true;
    }

    for (const row of workoutRows) {
      const when = row.endedAt ?? row.startedAt;
      if (!when) continue;
      const key = formatDateKey(new Date(when));
      const state = stateMap.get(key);
      if (state) state.workout = true;
    }

    const days = Array.from(stateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, state]) => buildHeatmapDay(date, state));

    return { weeks, startDate, endDate, streak, days };
  }

  async getTodayOverview(userId: string, dateKey: string): Promise<TodayOverviewPayload> {
    const monthKey = dateKey.slice(0, 7);

    const [checkins, dietDay, activeRows, schedule] = await Promise.all([
      this.getTodayCheckins(userId, new Date(`${dateKey}T12:00:00`)),
      this.getDietDay(userId, dateKey),
      db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'in_progress'),
          ),
        )
        .orderBy(desc(workoutSessions.startedAt))
        .limit(1),
      this.getMonthSchedule(userId, monthKey),
    ]);

    const activeSession = activeRows[0] ?? null;

    const daySchedule = schedule.days.find((day) => day.date === dateKey);
    const completedCount = (Object.keys(checkins) as CheckinType[]).filter(
      (key) => checkins[key],
    ).length;

    return {
      date: dateKey,
      checkins,
      completedCount,
      schedule: {
        planId: daySchedule?.planId ?? null,
        planName: daySchedule?.planName ?? null,
        isRest: daySchedule?.isRest ?? false,
      },
      diet: {
        calories: dietDay.totals.calories,
        calorieGoal: dietDay.calorieGoal,
        entryCount: dietDay.entries.length,
      },
      activeSessionId: activeSession?.id ?? null,
    };
  }

  async getStatsOverview(userId: string, rangeDays = 30): Promise<StatsOverviewPayload> {
    const safeDays = Math.min(Math.max(rangeDays, 7), 180);
    const endDate = formatDateKey(new Date());
    const startDate = shiftDateKey(endDate, -(safeDays - 1));
    const rangeStart = new Date(`${startDate}T00:00:00`);
    const rangeEnd = new Date(`${endDate}T23:59:59`);

    const trendMap = new Map<string, StatsTrendPoint>();
    let cursor = startDate;
    while (cursor <= endDate) {
      trendMap.set(cursor, {
        date: cursor,
        workoutVolume: 0,
        workoutMinutes: 0,
        dietCalories: 0,
        workoutSessions: 0,
      });
      cursor = shiftDateKey(cursor, 1);
    }

    const [sessions, dietRows, dailyCheckinRows, setRows, allTimeSetRows] = await Promise.all([
      db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'completed'),
            gte(workoutSessions.startedAt, rangeStart),
            lte(workoutSessions.startedAt, rangeEnd),
          ),
        ),
      db
        .select({
          logDate: dietLogs.logDate,
          calories: sql<number>`coalesce(sum(${dietLogEntries.calories}), 0)`,
        })
        .from(dietLogEntries)
        .innerJoin(dietLogs, eq(dietLogEntries.dietLogId, dietLogs.id))
        .where(
          and(
            eq(dietLogs.userId, userId),
            gte(dietLogs.logDate, startDate),
            lte(dietLogs.logDate, endDate),
          ),
        )
        .groupBy(dietLogs.logDate),
      db
        .select({ checkinDate: dailyCheckins.checkinDate })
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, userId),
            eq(dailyCheckins.type, 'daily'),
            gte(dailyCheckins.checkinDate, startDate),
            lte(dailyCheckins.checkinDate, endDate),
          ),
        ),
      db
        .select({
          exerciseId: exercises.id,
          exerciseName: exercises.name,
          bodyPart: exercises.bodyPart,
          exerciseType: exercises.type,
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          endedAt: workoutSessions.endedAt,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSets)
        .innerJoin(workoutSessionItems, eq(workoutSets.sessionItemId, workoutSessionItems.id))
        .innerJoin(workoutSessions, eq(workoutSessionItems.sessionId, workoutSessions.id))
        .innerJoin(exercises, eq(workoutSessionItems.exerciseId, exercises.id))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'completed'),
            eq(workoutSets.isCompleted, true),
            eq(exercises.type, 'strength'),
            gte(workoutSessions.startedAt, rangeStart),
            lte(workoutSessions.startedAt, rangeEnd),
          ),
        ),
      db
        .select({
          exerciseId: exercises.id,
          exerciseName: exercises.name,
          bodyPart: exercises.bodyPart,
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          endedAt: workoutSessions.endedAt,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSets)
        .innerJoin(workoutSessionItems, eq(workoutSets.sessionItemId, workoutSessionItems.id))
        .innerJoin(workoutSessions, eq(workoutSessionItems.sessionId, workoutSessions.id))
        .innerJoin(exercises, eq(workoutSessionItems.exerciseId, exercises.id))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSessions.status, 'completed'),
            eq(workoutSets.isCompleted, true),
            eq(exercises.type, 'strength'),
          ),
        ),
    ]);

    let totalVolume = 0;
    let totalCardioMinutes = 0;

    for (const session of sessions) {
      const when = session.endedAt ?? session.startedAt;
      const key = formatDateKey(new Date(when));
      const point = trendMap.get(key);
      if (!point) continue;

      point.workoutSessions += 1;
      point.workoutMinutes += Math.round((session.durationSeconds ?? 0) / 60);

      const summary = session.summaryJson as WorkoutSessionSummary | null;
      if (summary) {
        point.workoutVolume += summary.strengthVolume ?? 0;
        totalVolume += summary.strengthVolume ?? 0;
        totalCardioMinutes += summary.cardioMinutes ?? 0;
      }
    }

    for (const row of dietRows) {
      const key = String(row.logDate);
      const point = trendMap.get(key);
      if (point) point.dietCalories = Number(row.calories ?? 0);
    }

    const bodyPartMap = new Map<string, { setCount: number; volume: number }>();
    const prMap = new Map<number, StatsPrRecord>();

    for (const row of setRows) {
      const weight = row.weight != null ? Number(row.weight) : 0;
      const reps = row.reps ?? 0;
      const volume = weight * reps;
      const bodyPart = row.bodyPart ?? 'other';

      const slice = bodyPartMap.get(bodyPart) ?? { setCount: 0, volume: 0 };
      slice.setCount += 1;
      slice.volume += volume;
      bodyPartMap.set(bodyPart, slice);
    }

    for (const row of allTimeSetRows) {
      const weight = row.weight != null ? Number(row.weight) : 0;
      const reps = row.reps ?? 0;
      const volume = weight * reps;
      const achievedAt = (row.endedAt ?? row.startedAt).toISOString();
      const existing = prMap.get(row.exerciseId);
      if (!existing || weight > existing.weight) {
        prMap.set(row.exerciseId, {
          exerciseId: row.exerciseId,
          exerciseName: row.exerciseName,
          bodyPart: row.bodyPart,
          weight,
          reps,
          volume,
          achievedAt,
        });
      }
    }

    const trends = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const dietDaysWithData = trends.filter((point) => point.dietCalories > 0).length;
    const totalDietCalories = trends.reduce((sum, point) => sum + point.dietCalories, 0);

    const bodyParts: StatsBodyPartSlice[] = Array.from(bodyPartMap.entries())
      .map(([bodyPart, data]) => ({
        bodyPart,
        label: BODY_PART_LABELS[bodyPart] ?? bodyPart,
        setCount: data.setCount,
        volume: Math.round(data.volume),
      }))
      .sort((a, b) => b.volume - a.volume);

    const prs = Array.from(prMap.values())
      .filter((item) => item.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 12);

    return {
      rangeDays: safeDays,
      totals: {
        workoutSessions: sessions.length,
        totalVolume: Math.round(totalVolume),
        totalCardioMinutes,
        avgDailyCalories:
          dietDaysWithData > 0 ? Math.round(totalDietCalories / dietDaysWithData) : 0,
        checkinDays: dailyCheckinRows.length,
      },
      trends,
      prs,
      bodyParts,
    };
  }
}

function emptyWeekPattern(): Record<WeekDayKey, number | 'rest' | null> {
  return {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  };
}

function mapScheduleTemplate(row: typeof scheduleTemplates.$inferSelect): ScheduleTemplateRecord {
  const pattern = row.weekPattern as Record<WeekDayKey, number | 'rest' | null> | null;
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    isActive: row.isActive,
    cycleWeeks: row.cycleWeeks,
    weekPattern: { ...emptyWeekPattern(), ...(pattern ?? {}) },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createFitnessPlanDbService(db: FitnessPlanDrizzleDb) {
  return new FitnessPlanDbService(db);
}
