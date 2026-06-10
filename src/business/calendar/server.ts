/**
 * Calendar 模块 - 服务端专用导出
 * 
 * 这个文件包含只能在服务端使用的功能，包括：
 * - 数据库服务层
 * - 服务端配置和工具
 * - API处理函数
 * 
 * 注意：这些导出只能在服务端环境中使用，不要在客户端组件中导入！
 * 
 * 使用方式：
 * ```typescript
 * import { calendarDbService } from 'sa2kit/calendar/server';
 * ```
 * 
 * @version 1.0.0
 * @author Profile-v1 Team
 */

// ===== 数据库服务导出 =====
/**
 * 日历数据库服务
 * 
 * 提供所有与日历相关的数据库操作，包括：
 * - 事件的CRUD操作
 * - 重复规则管理
 * - 提醒管理
 * - 用户配置管理
 * - 事件分享功能
 */
import { calendarDbService } from './server/services';
export { calendarDbService };

// ===== 数据库Schema导出 =====
/**
 * 数据库表结构和关系定义
 * 
 * 用于数据库迁移、类型定义和关系查询
 */
export {
  calendarEvents,
  recurrenceRules,
  reminders,
  calendarConfigs,
  eventShares,
  calendarEventsRelations,
  recurrenceRulesRelations,
  remindersRelations,
  calendarConfigsRelations,
  eventSharesRelations,
} from './db/schema';

// 新分层 server 路由工厂导出
export * from './server/routes';

// ===== 服务端工具函数 =====
/**
 * 服务端专用的工具函数和常量
 */

/**
 * 默认日历配置
 */
export const DEFAULT_CALENDAR_CONFIG = {
  firstDayOfWeek: 1, // 周一开始
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  timeZone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  defaultView: 'month' as const,
  defaultEventColor: '#3B82F6',
  weekends: true,
  eventColors: {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    red: '#EF4444',
    yellow: '#F59E0B',
    pink: '#EC4899',
    indigo: '#6366F1',
    gray: '#6B7280'
  }
};

/**
 * 验证事件数据的服务端函数
 */
export function validateEventData(eventData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证必需字段
  if (!eventData.title || typeof eventData.title !== 'string' || eventData.title.trim() === '') {
    errors.push('事件标题不能为空');
  }

  if (!eventData.startTime) {
    errors.push('开始时间不能为空');
  }

  if (!eventData.endTime) {
    errors.push('结束时间不能为空');
  }

  // 验证时间逻辑
  if (eventData.startTime && eventData.endTime) {
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(eventData.endTime);

    if (isNaN(startTime.getTime())) {
      errors.push('开始时间格式无效');
    }

    if (isNaN(endTime.getTime())) {
      errors.push('结束时间格式无效');
    }

    if (startTime.getTime() >= endTime.getTime()) {
      errors.push('结束时间必须晚于开始时间');
    }
  }

  // 验证颜色格式
  if (eventData.color && !/^#[0-9A-Fa-f]{6}$/.test(eventData.color)) {
    errors.push('颜色格式无效，请使用十六进制格式（如 #FF0000）');
  }

  // 验证用户ID
  if (!eventData.userId || typeof eventData.userId !== 'number' || eventData.userId <= 0) {
    errors.push('用户ID无效');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证重复规则数据
 */
export function validateRecurrenceData(recurrenceData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!recurrenceData.ruleType) {
    errors.push('重复类型不能为空');
  }

  const validRuleTypes = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
  if (recurrenceData.ruleType && !validRuleTypes.includes(recurrenceData.ruleType)) {
    errors.push('重复类型无效');
  }

  if (!recurrenceData.interval || recurrenceData.interval < 1) {
    errors.push('重复间隔必须大于0');
  }

  // 验证结束条件
  if (recurrenceData.endDate && recurrenceData.count) {
    errors.push('不能同时设置结束日期和重复次数');
  }

  if (recurrenceData.endDate) {
    const endDate = new Date(recurrenceData.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('结束日期格式无效');
    }
  }

  if (recurrenceData.count && (recurrenceData.count < 1 || recurrenceData.count > 1000)) {
    errors.push('重复次数必须在1-1000之间');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成重复事件的服务端函数
 */
export function generateRecurrenceInstances(
  baseEvent: any,
  recurrenceRule: any,
  maxInstances: number = 100
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
    // 检查是否超过结束日期
    if (endDate && currentDate > endDate) {
      break;
    }

    // 添加实例
    instances.push({
      startTime: new Date(currentDate),
      endTime: new Date(currentDate.getTime() + duration)
    });

    count++;

    // 计算下一个实例的日期
    switch (recurrenceRule.ruleType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurrenceRule.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * recurrenceRule.interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrenceRule.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + recurrenceRule.interval);
        break;
      default:
        // 对于自定义规则，需要更复杂的逻辑
        break;
    }
  }

  return instances;
}

/**
 * 获取提醒发送时间
 */
export function calculateReminderTime(eventStartTime: Date, reminderOffset: number): Date {
  return new Date(eventStartTime.getTime() - reminderOffset);
}

/**
 * 格式化错误响应
 */
export function createErrorResponse(message: string, errors?: string[]): Response {
  return Response.json(
    {
      success: false,
      error: message,
      errors: errors
    },
    { status: 400 }
  );
}

/**
 * 格式化成功响应
 */
export function createSuccessResponse(data: any, message?: string): Response {
  return Response.json({
    success: true,
    data,
    message
  });
}

/**
 * 检查用户是否有权限访问事件
 */
export async function checkEventPermission(
  eventId: number,
  userId: number,
  requiredPermission: 'read' | 'write' = 'read'
): Promise<boolean> {
  try {
    // 检查是否是事件创建者
    const event = await calendarDbService.getEventById(eventId);
    if (!event) return false;
    
    // 目前只允许事件创建者访问
    return event.userId === userId;
  } catch (error) {
    console.error('检查事件权限时出错：', error);
    return false;
  }
}

// ===== 模块信息 =====
export const CALENDAR_SERVER_MODULE_VERSION = '1.0.0';
export const CALENDAR_SERVER_MODULE_NAME = 'sa2kit/calendar/server'; 