/**
 * 事件类型服务
 * 
 * 负责处理不同类型事件的创建逻辑：
 * 1. 单次事件 (Single Event)
 * 2. 多天事件 (Multi-day Event) 
 * 3. 重复事件 (Recurring Event)
 */

export enum EventType {
  SINGLE = 'single',           // 单次事件
  MULTI_DAY = 'multi_day',     // 多天事件（跨越多个日期的单个事件）
  RECURRING = 'recurring'      // 重复事件（按规律重复发生）
}

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export interface BaseEventData {
  title: string;
  description?: string;
  location?: string;
  color: string;
  priority: string;
  allDay: boolean;
}

export interface SingleEventData extends BaseEventData {
  type: EventType.SINGLE;
  startTime: Date;
  endTime: Date;
}

export interface MultiDayEventData extends BaseEventData {
  type: EventType.MULTI_DAY;
  startDate: Date;  // 开始日期
  endDate: Date;    // 结束日期（包含）
  startTime?: string; // 每日开始时间 "09:00"
  endTime?: string;   // 每日结束时间 "17:00"
}

export interface RecurringEventData extends BaseEventData {
  type: EventType.RECURRING;
  startDate: Date;
  startTime: Date;
  endTime: Date;
  recurrence: {
    pattern: RecurrencePattern;
    interval: number;        // 间隔（每N天/周/月）
    endDate?: Date;         // 结束日期
    count?: number;         // 重复次数
    daysOfWeek?: number[];  // 星期几（用于每周重复）
  };
}

export type EventData = SingleEventData | MultiDayEventData | RecurringEventData;

export interface GeneratedEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  color: string;
  priority: string;
  allDay: boolean;
  // 元数据
  eventType: EventType;
  parentEventId?: string;     // 对于多天事件和重复事件，指向父事件
  instanceDate?: string;      // 实例日期 (YYYY-MM-DD)
  isMultiDayPart?: boolean;   // 是否是多天事件的一部分
  isRecurringInstance?: boolean; // 是否是重复事件的实例
}

export class EventTypeService {
  
  /**
   * 根据事件数据生成实际的事件实例
   */
  static generateEventInstances(
    eventData: EventData,
    viewStartDate: Date,
    viewEndDate: Date,
    parentEventId?: string
  ): GeneratedEvent[] {
    switch (eventData.type) {
      case EventType.SINGLE:
        return this.generateSingleEvent(eventData, parentEventId);
      
      case EventType.MULTI_DAY:
        return this.generateMultiDayEvents(eventData, viewStartDate, viewEndDate, parentEventId);
      
      case EventType.RECURRING:
        return this.generateRecurringEvents(eventData, viewStartDate, viewEndDate, parentEventId);
      
      default:
        throw new Error(`不支持的事件类型: ${(eventData as any).type}`);
    }
  }

  /**
   * 生成单次事件
   */
  private static generateSingleEvent(
    eventData: SingleEventData, 
    parentEventId?: string
  ): GeneratedEvent[] {
    return [{
      ...eventData,
      eventType: EventType.SINGLE,
      parentEventId
    }];
  }

  /**
   * 生成多天事件实例
   * 例：21-23号的会议 -> 创建3个事件实例，每个代表一天
   */
  private static generateMultiDayEvents(
    eventData: MultiDayEventData,
    viewStartDate: Date,
    viewEndDate: Date,
    parentEventId?: string
  ): GeneratedEvent[] {
    const events: GeneratedEvent[] = [];
    const currentDate = new Date(eventData.startDate);
    
    // 确保不超出视图范围
    const actualStartDate = currentDate < viewStartDate ? viewStartDate : currentDate;
    const actualEndDate = eventData.endDate > viewEndDate ? viewEndDate : eventData.endDate;
    
    currentDate.setTime(actualStartDate.getTime());
    
    while (currentDate <= actualEndDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      
      if (eventData.allDay) {
        // 全天事件
        dayStart.setHours(0, 0, 0, 0);
        dayEnd.setHours(23, 59, 59, 999);
      } else {
        // 定时事件，使用指定的时间
        const [startHour, startMinute] = (eventData.startTime || '09:00').split(':').map(Number);
        const [endHour, endMinute] = (eventData.endTime || '17:00').split(':').map(Number);
        
        dayStart.setHours(startHour, startMinute, 0, 0);
        dayEnd.setHours(endHour, endMinute, 0, 0);
      }
      
      events.push({
        title: eventData.title,
        description: eventData.description,
        startTime: dayStart,
        endTime: dayEnd,
        location: eventData.location,
        color: eventData.color,
        priority: eventData.priority,
        allDay: eventData.allDay,
        eventType: EventType.MULTI_DAY,
        parentEventId,
        instanceDate: this.formatDateString(currentDate),
        isMultiDayPart: true
      });
      
      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return events;
  }

  /**
   * 生成重复事件实例
   */
  private static generateRecurringEvents(
    eventData: RecurringEventData,
    viewStartDate: Date,
    viewEndDate: Date,
    parentEventId?: string
  ): GeneratedEvent[] {
    const events: GeneratedEvent[] = [];
    const { recurrence } = eventData;
    
    let currentDate = new Date(eventData.startDate);
    let instanceCount = 0;
    const maxInstances = recurrence.count || 1000;
    
    // 确定结束条件
    const endDate = recurrence.endDate || viewEndDate;
    const actualEndDate = endDate < viewEndDate ? endDate : viewEndDate;
    
    while (currentDate <= actualEndDate && instanceCount < maxInstances) {
      // 检查当前日期是否在视图范围内
      if (currentDate >= viewStartDate) {
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(
          eventData.startTime.getHours(),
          eventData.startTime.getMinutes(),
          eventData.startTime.getSeconds()
        );
        
        const instanceEnd = new Date(currentDate);
        instanceEnd.setHours(
          eventData.endTime.getHours(),
          eventData.endTime.getMinutes(),
          eventData.endTime.getSeconds()
        );
        
        events.push({
          title: eventData.title,
          description: eventData.description,
          startTime: instanceStart,
          endTime: instanceEnd,
          location: eventData.location,
          color: eventData.color,
          priority: eventData.priority,
          allDay: eventData.allDay,
          eventType: EventType.RECURRING,
          parentEventId,
          instanceDate: this.formatDateString(currentDate),
          isRecurringInstance: true
        });
        
        instanceCount++;
      }
      
      // 计算下一次重复的日期
      currentDate = this.getNextRecurrenceDate(currentDate, recurrence);
    }
    
    return events;
  }

  /**
   * 计算下一次重复的日期
   */
  private static getNextRecurrenceDate(
    currentDate: Date, 
    recurrence: RecurringEventData['recurrence']
  ): Date {
    const nextDate = new Date(currentDate);
    
    switch (recurrence.pattern) {
      case RecurrencePattern.DAILY:
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
        break;
        
      case RecurrencePattern.WEEKLY:
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval));
        break;
        
      case RecurrencePattern.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        break;
        
      case RecurrencePattern.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
        break;
        
      default:
        throw new Error(`不支持的重复模式: ${recurrence.pattern}`);
    }
    
    return nextDate;
  }

  /**
   * 格式化日期为字符串 (YYYY-MM-DD)
   */
  private static formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 验证事件数据
   */
  static validateEventData(eventData: EventData): string[] {
    const errors: string[] = [];
    
    // 基础验证
    if (!eventData.title?.trim()) {
      errors.push('事件标题不能为空');
    }
    
    if (!eventData.color) {
      errors.push('请选择事件颜色');
    }
    
    // 根据类型进行特定验证
    switch (eventData.type) {
      case EventType.SINGLE:
        errors.push(...this.validateSingleEvent(eventData));
        break;
        
      case EventType.MULTI_DAY:
        errors.push(...this.validateMultiDayEvent(eventData));
        break;
        
      case EventType.RECURRING:
        errors.push(...this.validateRecurringEvent(eventData));
        break;
    }
    
    return errors;
  }

  private static validateSingleEvent(eventData: SingleEventData): string[] {
    const errors: string[] = [];
    
    if (!eventData.startTime) {
      errors.push('请设置开始时间');
    }
    
    if (!eventData.endTime) {
      errors.push('请设置结束时间');
    }
    
    if (eventData.startTime && eventData.endTime && eventData.endTime <= eventData.startTime) {
      errors.push('结束时间必须晚于开始时间');
    }
    
    return errors;
  }

  private static validateMultiDayEvent(eventData: MultiDayEventData): string[] {
    const errors: string[] = [];
    
    if (!eventData.startDate) {
      errors.push('请设置开始日期');
    }
    
    if (!eventData.endDate) {
      errors.push('请设置结束日期');
    }
    
    if (eventData.startDate && eventData.endDate && eventData.endDate < eventData.startDate) {
      errors.push('结束日期必须不早于开始日期');
    }
    
    // 验证时间格式
    if (!eventData.allDay) {
      if (eventData.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.startTime)) {
        errors.push('开始时间格式不正确 (HH:MM)');
      }
      
      if (eventData.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.endTime)) {
        errors.push('结束时间格式不正确 (HH:MM)');
      }
    }
    
    return errors;
  }

  private static validateRecurringEvent(eventData: RecurringEventData): string[] {
    const errors: string[] = [];
    
    if (!eventData.startDate) {
      errors.push('请设置开始日期');
    }
    
    if (!eventData.startTime) {
      errors.push('请设置开始时间');
    }
    
    if (!eventData.endTime) {
      errors.push('请设置结束时间');
    }
    
    if (eventData.startTime && eventData.endTime && eventData.endTime <= eventData.startTime) {
      errors.push('结束时间必须晚于开始时间');
    }
    
    // 验证重复规则
    const { recurrence } = eventData;
    
    if (!recurrence.pattern) {
      errors.push('请选择重复模式');
    }
    
    if (!recurrence.interval || recurrence.interval < 1) {
      errors.push('重复间隔必须大于0');
    }
    
    if (recurrence.interval > 365) {
      errors.push('重复间隔不能超过365');
    }
    
    if (recurrence.endDate && recurrence.count && recurrence.count > 0) {
      errors.push('不能同时设置结束日期和重复次数');
    }
    
    if (recurrence.count && (recurrence.count < 1 || recurrence.count > 999)) {
      errors.push('重复次数必须在1-999之间');
    }
    
    return errors;
  }

  /**
   * 获取事件类型的描述文本
   */
  static getEventTypeDescription(eventData: EventData): string {
    switch (eventData.type) {
      case EventType.SINGLE:
        return '单次事件';
        
      case EventType.MULTI_DAY:
        const dayCount = Math.ceil((eventData.endDate.getTime() - eventData.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        return `持续 ${dayCount} 天`;
        
      case EventType.RECURRING:
        const { pattern, interval, count, endDate } = eventData.recurrence;
        let desc = '';
        
        switch (pattern) {
          case RecurrencePattern.DAILY:
            desc = interval === 1 ? '每天' : `每 ${interval} 天`;
            break;
          case RecurrencePattern.WEEKLY:
            desc = interval === 1 ? '每周' : `每 ${interval} 周`;
            break;
          case RecurrencePattern.MONTHLY:
            desc = interval === 1 ? '每月' : `每 ${interval} 个月`;
            break;
          case RecurrencePattern.YEARLY:
            desc = interval === 1 ? '每年' : `每 ${interval} 年`;
            break;
        }
        
        if (count) {
          desc += `，共 ${count} 次`;
        } else if (endDate) {
          desc += `，直到 ${endDate.toLocaleDateString('zh-CN')}`;
        }
        
        return desc;
        
      default:
        return '未知类型';
    }
  }
} 