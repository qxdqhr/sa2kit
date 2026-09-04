import type { CalendarDbService } from './calendarDbService';

export function validateEventData(eventData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!eventData.title || typeof eventData.title !== 'string' || eventData.title.trim() === '') {
    errors.push('事件标题不能为空');
  }
  if (!eventData.startTime) errors.push('开始时间不能为空');
  if (!eventData.endTime) errors.push('结束时间不能为空');

  if (eventData.startTime && eventData.endTime) {
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(eventData.endTime);
    if (isNaN(startTime.getTime())) errors.push('开始时间格式无效');
    if (isNaN(endTime.getTime())) errors.push('结束时间格式无效');
    if (startTime.getTime() >= endTime.getTime()) {
      errors.push('结束时间必须晚于开始时间');
    }
  }

  if (eventData.color && !/^#[0-9A-Fa-f]{6}$/.test(eventData.color)) {
    errors.push('颜色格式无效，请使用十六进制格式（如 #FF0000）');
  }
  if (!eventData.userId || typeof eventData.userId !== 'string' || eventData.userId.length === 0) {
    errors.push('用户ID无效');
  }

  return { valid: errors.length === 0, errors };
}

export function validateRecurrenceData(recurrenceData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!recurrenceData.ruleType) errors.push('重复类型不能为空');
  const validRuleTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
  if (recurrenceData.ruleType && !validRuleTypes.includes(recurrenceData.ruleType)) {
    errors.push('重复类型无效');
  }
  if (!recurrenceData.interval || recurrenceData.interval < 1) {
    errors.push('重复间隔必须大于0');
  }
  if (recurrenceData.endDate && recurrenceData.count) {
    errors.push('不能同时设置结束日期和重复次数');
  }
  if (recurrenceData.endDate) {
    const endDate = new Date(recurrenceData.endDate);
    if (isNaN(endDate.getTime())) errors.push('结束日期格式无效');
  }
  if (recurrenceData.count && (recurrenceData.count < 1 || recurrenceData.count > 1000)) {
    errors.push('重复次数必须在1-1000之间');
  }
  return { valid: errors.length === 0, errors };
}

export function generateRecurrenceInstances(
  baseEvent: any,
  recurrenceRule: any,
  maxInstances: number = 100,
): Array<{ startTime: Date; endTime: Date }> {
  const instances: Array<{ startTime: Date; endTime: Date }> = [];
  const startTime = new Date(baseEvent.startTime);
  const endTime = new Date(baseEvent.endTime);
  const duration = endTime.getTime() - startTime.getTime();
  let currentDate = new Date(startTime);
  let count = 0;
  const endDate = recurrenceRule.endDate ? new Date(recurrenceRule.endDate) : null;
  const maxCount = recurrenceRule.count || maxInstances;

  while (count < maxCount) {
    if (endDate && currentDate > endDate) break;
    instances.push({
      startTime: new Date(currentDate),
      endTime: new Date(currentDate.getTime() + duration),
    });
    count += 1;
    switch (recurrenceRule.ruleType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurrenceRule.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * recurrenceRule.interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrenceRule.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + recurrenceRule.interval);
        break;
      default:
        break;
    }
  }
  return instances;
}

export function calculateReminderTime(eventStartTime: Date, reminderOffset: number): Date {
  return new Date(eventStartTime.getTime() - reminderOffset);
}

export function createErrorResponse(message: string, errors?: string[]): Response {
  return Response.json({ success: false, error: message, errors }, { status: 400 });
}

export function createSuccessResponse(data: any, message?: string): Response {
  return Response.json({ success: true, data, message });
}

export async function checkEventPermission(
  dbService: Pick<CalendarDbService, 'getEventById'>,
  eventId: number,
  userId: string,
  _requiredPermission: 'read' | 'write' = 'read',
): Promise<boolean> {
  try {
    const event = await dbService.getEventById(eventId);
    if (!event) return false;
    return event.userId === userId;
  } catch (error) {
    console.error('检查事件权限时出错：', error);
    return false;
  }
}

export const CALENDAR_SERVER_MODULE_VERSION = '1.0.0';
export const CALENDAR_SERVER_MODULE_NAME = 'sa2kit/business/calendar/server';
