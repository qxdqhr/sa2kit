import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  dailyCheckins,
  fitnessProfiles,
} from '../db/schema';

export type FitnessProfile = InferSelectModel<typeof fitnessProfiles>;
export type NewFitnessProfile = InferInsertModel<typeof fitnessProfiles>;
export type DailyCheckin = InferSelectModel<typeof dailyCheckins>;

export type FitnessGoal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'maintain'
  | 'strength'
  | 'endurance';

export type ExerciseType = 'strength' | 'cardio';

export type WorkoutPlanStatus = 'active' | 'archived';

export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CheckinType = 'daily' | 'workout' | 'diet' | 'weight';

export interface CheckinTodayState {
  daily: boolean;
  workout: boolean;
  diet: boolean;
  weight: boolean;
}

export interface FitnessProfileFormData {
  goal?: FitnessGoal;
  currentWeight?: number | null;
  weightUnit?: 'kg' | 'lb';
  dailyCalorieGoal?: number;
}

export interface ActiveWorkoutState {
  sessionId: number | null;
  startedAt: string | null;
}

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  muscle_gain: '增肌',
  fat_loss: '减脂',
  maintain: '维持',
  strength: '力量',
  endurance: '耐力',
};

export const CHECKIN_TYPE_LABELS: Record<CheckinType, string> = {
  daily: '综合日打卡',
  workout: '训练打卡',
  diet: '饮食打卡',
  weight: '体重打卡',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface FitnessNavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export const FITNESS_NAV_ITEMS: FitnessNavItem[] = [
  { id: 'today', label: '今日', href: '/' },
  { id: 'plans', label: '计划', href: '/plans' },
  { id: 'schedule', label: '日历', href: '/schedule' },
  { id: 'workout', label: '训练', href: '/workout' },
  { id: 'diet', label: '饮食', href: '/diet' },
  { id: 'checkin', label: '打卡', href: '/checkin' },
  { id: 'stats', label: '统计', href: '/stats' },
  { id: 'settings', label: '设置', href: '/settings' },
];

export const FITNESS_MOBILE_NAV_ITEMS: FitnessNavItem[] = [
  { id: 'today', label: '今日', href: '/' },
  { id: 'plans', label: '计划', href: '/plans' },
  { id: 'checkin', label: '打卡', href: '/checkin' },
  { id: 'diet', label: '饮食', href: '/diet' },
  { id: 'more', label: '更多', href: '/settings' },
];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseProfileNumbers(profile: FitnessProfile) {
  return {
    ...profile,
    currentWeight:
      profile.currentWeight != null ? Number(profile.currentWeight) : null,
  };
}

export type FitnessProfileClient = ReturnType<typeof parseProfileNumbers>;

export interface ExerciseRecord {
  id: number;
  userId: string | null;
  name: string;
  type: ExerciseType;
  bodyPart: string | null;
  equipment: string | null;
  cardioType: string | null;
  description: string | null;
  isCustom: boolean;
}

export interface ExerciseFormData {
  name: string;
  type: ExerciseType;
  bodyPart?: string;
  equipment?: string;
  cardioType?: string;
  description?: string;
}

export interface PlanItemInput {
  exerciseId?: number;
  exerciseName?: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  restSeconds?: number;
  targetDurationMinutes?: number;
  targetDistance?: number;
  targetCalories?: number;
}

export interface WorkoutPlanRecord {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  goalTags: string[];
  status: WorkoutPlanStatus;
  isTemplate: boolean;
  sourceTemplateId: number | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanItemRecord extends PlanItemInput {
  id: number;
  planId: number;
  sortOrder: number;
  exercise?: ExerciseRecord;
}

export interface WorkoutPlanDetail extends WorkoutPlanRecord {
  items: WorkoutPlanItemRecord[];
}

export interface WorkoutPlanFormData {
  name: string;
  description?: string;
  goalTags?: string[];
}

export const BODY_PART_LABELS: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulder: '肩',
  arms: '臂',
  core: '核心',
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  strength: '力量',
  cardio: '有氧',
};

export type WeekDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEK_DAY_KEYS: WeekDayKey[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

export const WEEK_DAY_LABELS: Record<WeekDayKey, string> = {
  mon: '周一',
  tue: '周二',
  wed: '周三',
  thu: '周四',
  fri: '周五',
  sat: '周六',
  sun: '周日',
};

export interface ScheduleTemplateRecord {
  id: number;
  userId: string;
  name: string;
  isActive: boolean;
  cycleWeeks: number;
  weekPattern: Record<WeekDayKey, number | 'rest' | null>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDayBadge {
  workout: boolean;
  diet: boolean;
  daily: boolean;
}

export interface ScheduleDayInfo {
  date: string;
  planId: number | null;
  planName: string | null;
  isRest: boolean;
  isOverride: boolean;
  badges: ScheduleDayBadge;
}

export interface MonthSchedulePayload {
  month: string;
  template: ScheduleTemplateRecord;
  days: ScheduleDayInfo[];
}

export interface ScheduleOverrideInput {
  date: string;
  planId?: number | null;
  isRest?: boolean;
  clear?: boolean;
}

export interface ScheduleTemplateInput {
  name?: string;
  cycleWeeks?: number;
  weekPattern?: Partial<Record<WeekDayKey, number | 'rest' | null>>;
}

export function dateToWeekDayKey(date: Date): WeekDayKey {
  const map: Record<number, WeekDayKey> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };
  return map[date.getDay()];
}

export interface WorkoutSetRecord {
  id: number;
  sessionItemId: number;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  durationMinutes?: number | null;
  distance?: number | null;
  calories?: number | null;
  isCompleted: boolean;
}

export interface WorkoutSessionItemDetail {
  id: number;
  sessionId: number;
  exerciseId: number;
  sortOrder: number;
  restSeconds: number;
  exercise: ExerciseRecord;
  sets: WorkoutSetRecord[];
}

export interface WorkoutSessionDetail {
  id: number;
  userId: string;
  planId: number | null;
  planName: string | null;
  status: WorkoutSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  summaryJson: Record<string, unknown> | null;
  items: WorkoutSessionItemDetail[];
}

export interface WorkoutSessionListItem {
  id: number;
  planId: number | null;
  planName: string | null;
  status: WorkoutSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
}

export interface StartWorkoutInput {
  planId?: number;
  empty?: boolean;
}

export interface UpdateWorkoutSetInput {
  weight?: number | null;
  reps?: number | null;
  durationMinutes?: number | null;
  distance?: number | null;
  calories?: number | null;
  isCompleted?: boolean;
}

export interface CompleteWorkoutInput {
  status: 'completed' | 'abandoned';
  notes?: string;
}

export interface WorkoutSessionSummary {
  totalSets: number;
  completedSets: number;
  strengthVolume: number;
  cardioMinutes: number;
}

export interface FoodItemRecord {
  id: number;
  userId: string | null;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isCustom: boolean;
}

export interface FoodItemFormData {
  name: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface DietLogEntryRecord {
  id: number;
  dietLogId: number;
  mealType: MealType;
  foodName: string;
  foodItemId: number | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface DietDayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietDayPayload {
  logDate: string;
  logId: number | null;
  entries: DietLogEntryRecord[];
  totals: DietDayTotals;
  calorieGoal: number;
}

export interface DietEntryInput {
  logDate: string;
  mealType: MealType;
  foodName: string;
  foodItemId?: number;
  calories?: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  imageUrl?: string | null;
}

export interface DietEntryUpdateInput {
  mealType?: MealType;
  foodName?: string;
  calories?: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  imageUrl?: string | null;
}

export interface ManualCheckinInput {
  date?: string;
  type: 'daily' | 'weight';
  currentWeight?: number | null;
}

export interface CheckinHeatmapDay {
  date: string;
  daily: boolean;
  workout: boolean;
  diet: boolean;
  weight: boolean;
  score: number;
}

export interface CheckinStreakInfo {
  current: number;
  best: number;
}

export interface CheckinHeatmapPayload {
  weeks: number;
  startDate: string;
  endDate: string;
  streak: CheckinStreakInfo;
  days: CheckinHeatmapDay[];
}

export interface TodayScheduleSummary {
  planId: number | null;
  planName: string | null;
  isRest: boolean;
}

export interface TodayDietSummary {
  calories: number;
  calorieGoal: number;
  entryCount: number;
}

export interface TodayOverviewPayload {
  date: string;
  checkins: CheckinTodayState;
  completedCount: number;
  schedule: TodayScheduleSummary;
  diet: TodayDietSummary;
  activeSessionId: number | null;
}

export interface StatsTrendPoint {
  date: string;
  workoutVolume: number;
  workoutMinutes: number;
  dietCalories: number;
  workoutSessions: number;
}

export interface StatsPrRecord {
  exerciseId: number;
  exerciseName: string;
  bodyPart: string | null;
  weight: number;
  reps: number;
  volume: number;
  achievedAt: string;
}

export interface StatsBodyPartSlice {
  bodyPart: string;
  label: string;
  setCount: number;
  volume: number;
}

export interface StatsTotals {
  workoutSessions: number;
  totalVolume: number;
  totalCardioMinutes: number;
  avgDailyCalories: number;
  checkinDays: number;
}

export interface StatsOverviewPayload {
  rangeDays: number;
  totals: StatsTotals;
  trends: StatsTrendPoint[];
  prs: StatsPrRecord[];
  bodyParts: StatsBodyPartSlice[];
}
