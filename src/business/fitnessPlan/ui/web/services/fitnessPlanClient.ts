import { fitnessPlanApiPath } from '../../../domain/fitnessPlanApiPath';
import type {
  ExerciseFormData,
  ExerciseRecord,
  FitnessProfileFormData,
  PlanItemInput,
  WorkoutPlanDetail,
  WorkoutPlanFormData,
  WorkoutPlanRecord,
  WorkoutPlanStatus,
} from '../../../domain/types';
import { parseProfileNumbers } from '../../../domain/types';
import type { PlanTemplateDefinition } from '../../../domain/data/planTemplates';
import { PLAN_TEMPLATES } from '../../../domain/data/planTemplates';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? '请求失败');
  }
  return payload as T;
}

export const fitnessPlanClient = {
  getProfile() {
    return request<{ success: boolean; data: ReturnType<typeof parseProfileNumbers> }>(
      fitnessPlanApiPath('profile'),
    ).then((res) => res.data);
  },

  updateProfile(data: FitnessProfileFormData) {
    return request<{ success: boolean; data: ReturnType<typeof parseProfileNumbers> }>(
      fitnessPlanApiPath('profile'),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  listExercises(params?: { search?: string; type?: string; bodyPart?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type) query.set('type', params.type);
    if (params?.bodyPart) query.set('bodyPart', params.bodyPart);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<{ success: boolean; data: ExerciseRecord[] }>(
      fitnessPlanApiPath(`exercises${suffix}`),
    ).then((res) => res.data);
  },

  createExercise(data: ExerciseFormData) {
    return request<{ success: boolean; data: ExerciseRecord }>(
      fitnessPlanApiPath('exercises'),
      { method: 'POST', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  updateExercise(id: number, data: ExerciseFormData) {
    return request<{ success: boolean; data: ExerciseRecord }>(
      fitnessPlanApiPath(`exercises/${id}`),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  deleteExercise(id: number) {
    return request<{ success: boolean }>(fitnessPlanApiPath(`exercises/${id}`), {
      method: 'DELETE',
    });
  },

  listPlans(status: WorkoutPlanStatus = 'active') {
    return request<{ success: boolean; data: WorkoutPlanRecord[] }>(
      fitnessPlanApiPath(`plans?status=${status}`),
    ).then((res) => res.data);
  },

  getPlanTemplates() {
    return request<{ success: boolean; data: PlanTemplateDefinition[] }>(
      fitnessPlanApiPath('plans/templates'),
    ).then((res) => res.data);
  },

  getPlan(id: number) {
    return request<{ success: boolean; data: WorkoutPlanDetail }>(
      fitnessPlanApiPath(`plans/${id}`),
    ).then((res) => res.data);
  },

  createPlan(data: WorkoutPlanFormData, items: PlanItemInput[] = []) {
    return request<{ success: boolean; data: WorkoutPlanDetail }>(
      fitnessPlanApiPath('plans'),
      { method: 'POST', body: JSON.stringify({ ...data, items }) },
    ).then((res) => res.data);
  },

  updatePlan(id: number, data: Partial<WorkoutPlanFormData> & { status?: WorkoutPlanStatus }) {
    return request<{ success: boolean; data: WorkoutPlanRecord }>(
      fitnessPlanApiPath(`plans/${id}`),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  deletePlan(id: number) {
    return request<{ success: boolean }>(fitnessPlanApiPath(`plans/${id}`), {
      method: 'DELETE',
    });
  },

  copyPlan(id: number) {
    return request<{ success: boolean; data: WorkoutPlanDetail }>(
      fitnessPlanApiPath(`plans/${id}/copy`),
      { method: 'POST' },
    ).then((res) => res.data);
  },

  copyTemplate(templateId: string) {
    return request<{ success: boolean; data: WorkoutPlanDetail }>(
      fitnessPlanApiPath('plans/templates/copy'),
      { method: 'POST', body: JSON.stringify({ templateId }) },
    ).then((res) => res.data);
  },

  copyTemplateGroup(groupId: string) {
    return request<{ success: boolean; data: WorkoutPlanDetail[] }>(
      fitnessPlanApiPath('plans/templates/copy'),
      { method: 'POST', body: JSON.stringify({ groupId }) },
    ).then((res) => res.data);
  },

  setPlanItems(id: number, items: PlanItemInput[]) {
    return request<{ success: boolean; data: WorkoutPlanDetail }>(
      fitnessPlanApiPath(`plans/${id}/items`),
      { method: 'PUT', body: JSON.stringify({ items }) },
    ).then((res) => res.data);
  },

  getMonthSchedule(month: string) {
    return request<{ success: boolean; data: import('../types').MonthSchedulePayload }>(
      fitnessPlanApiPath(`schedule?month=${month}`),
    ).then((res) => res.data);
  },

  getScheduleTemplate() {
    return request<{ success: boolean; data: import('../types').ScheduleTemplateRecord }>(
      fitnessPlanApiPath('schedule/template'),
    ).then((res) => res.data);
  },

  updateScheduleTemplate(data: import('../types').ScheduleTemplateInput) {
    return request<{ success: boolean; data: import('../types').ScheduleTemplateRecord }>(
      fitnessPlanApiPath('schedule/template'),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  setScheduleOverride(data: import('../types').ScheduleOverrideInput) {
    return request<{ success: boolean; data: import('../types').MonthSchedulePayload }>(
      fitnessPlanApiPath('schedule/overrides'),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  listSessions() {
    return request<{ success: boolean; data: import('../types').WorkoutSessionListItem[] }>(
      fitnessPlanApiPath('sessions'),
    ).then((res) => res.data);
  },

  getActiveSession() {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail | null }>(
      fitnessPlanApiPath('sessions/active'),
    ).then((res) => res.data);
  },

  getTodayPlanId() {
    return request<{ success: boolean; data: { planId: number | null } }>(
      fitnessPlanApiPath('sessions/today-plan'),
    ).then((res) => res.data.planId);
  },

  getSession(id: number) {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail }>(
      fitnessPlanApiPath(`sessions/${id}`),
    ).then((res) => res.data);
  },

  startSession(input: import('../types').StartWorkoutInput) {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail }>(
      fitnessPlanApiPath('sessions'),
      { method: 'POST', body: JSON.stringify(input) },
    ).then((res) => res.data);
  },

  addSessionExercise(sessionId: number, exerciseId: number) {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail }>(
      fitnessPlanApiPath(`sessions/${sessionId}/exercises`),
      { method: 'POST', body: JSON.stringify({ exerciseId }) },
    ).then((res) => res.data);
  },

  addWorkoutSet(sessionItemId: number) {
    return request<{ success: boolean; data: import('../types').WorkoutSetRecord }>(
      fitnessPlanApiPath(`sessions/items/${sessionItemId}/sets`),
      { method: 'POST' },
    ).then((res) => res.data);
  },

  updateWorkoutSet(setId: number, input: import('../types').UpdateWorkoutSetInput) {
    return request<{ success: boolean; data: import('../types').WorkoutSetRecord }>(
      fitnessPlanApiPath(`sessions/sets/${setId}`),
      { method: 'PUT', body: JSON.stringify(input) },
    ).then((res) => res.data);
  },

  updateSessionNotes(sessionId: number, notes: string | null) {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail }>(
      fitnessPlanApiPath(`sessions/${sessionId}`),
      { method: 'PUT', body: JSON.stringify({ notes }) },
    ).then((res) => res.data);
  },

  completeSession(sessionId: number, input: import('../types').CompleteWorkoutInput) {
    return request<{ success: boolean; data: import('../types').WorkoutSessionDetail }>(
      fitnessPlanApiPath(`sessions/${sessionId}/complete`),
      { method: 'POST', body: JSON.stringify(input) },
    ).then((res) => res.data);
  },

  listFoodItems(params?: { search?: string }) {
    const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : '';
    return request<{ success: boolean; data: import('../types').FoodItemRecord[] }>(
      fitnessPlanApiPath(`foods${query}`),
    ).then((res) => res.data);
  },

  createFoodItem(data: import('../types').FoodItemFormData) {
    return request<{ success: boolean; data: import('../types').FoodItemRecord }>(
      fitnessPlanApiPath('foods'),
      { method: 'POST', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  getDietDay(date: string) {
    return request<{ success: boolean; data: import('../types').DietDayPayload }>(
      fitnessPlanApiPath(`diet?date=${encodeURIComponent(date)}`),
    ).then((res) => res.data);
  },

  addDietEntry(data: import('../types').DietEntryInput) {
    return request<{ success: boolean; data: import('../types').DietDayPayload }>(
      fitnessPlanApiPath('diet/entries'),
      { method: 'POST', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  updateDietEntry(entryId: number, data: import('../types').DietEntryUpdateInput) {
    return request<{ success: boolean; data: import('../types').DietDayPayload }>(
      fitnessPlanApiPath(`diet/entries/${entryId}`),
      { method: 'PUT', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  deleteDietEntry(entryId: number) {
    return request<{ success: boolean; data: import('../types').DietDayPayload }>(
      fitnessPlanApiPath(`diet/entries/${entryId}`),
      { method: 'DELETE' },
    ).then((res) => res.data);
  },

  async uploadDietImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(fitnessPlanApiPath('diet/upload'), {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? payload.message ?? '图片上传失败');
    }
    return payload.data as { imageUrl: string; fileId: string };
  },

  getCheckinsToday(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<{ success: boolean; data: import('../types').CheckinTodayState }>(
      fitnessPlanApiPath(`checkins/today${query}`),
    ).then((res) => res.data);
  },

  createManualCheckin(data: import('../types').ManualCheckinInput) {
    return request<{ success: boolean; data: import('../types').CheckinTodayState }>(
      fitnessPlanApiPath('checkins'),
      { method: 'POST', body: JSON.stringify(data) },
    ).then((res) => res.data);
  },

  removeManualCheckin(date: string, type: 'daily' | 'weight') {
    return request<{ success: boolean; data: import('../types').CheckinTodayState }>(
      fitnessPlanApiPath(`checkins?date=${encodeURIComponent(date)}&type=${type}`),
      { method: 'DELETE' },
    ).then((res) => res.data);
  },

  getCheckinHeatmap(weeks = 12) {
    return request<{ success: boolean; data: import('../types').CheckinHeatmapPayload }>(
      fitnessPlanApiPath(`checkins/heatmap?weeks=${weeks}`),
    ).then((res) => res.data);
  },

  getTodayOverview(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<{ success: boolean; data: import('../types').TodayOverviewPayload }>(
      fitnessPlanApiPath(`today${query}`),
    ).then((res) => res.data);
  },

  getStatsOverview(days = 30) {
    return request<{ success: boolean; data: import('../types').StatsOverviewPayload }>(
      fitnessPlanApiPath(`stats?days=${days}`),
    ).then((res) => res.data);
  },

  getTemplatesStatic() {
    return PLAN_TEMPLATES;
  },
};
