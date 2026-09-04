interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // 重复间隔
  endDate?: string; // 结束日期 (YYYY-MM-DD格式)
  count?: number; // 重复次数
  daysOfWeek?: number[]; // 星期几 (0=周日, 1=周一, ...)
  dayOfMonth?: number; // 月份中的第几天
  weekOfMonth?: number; // 月份中的第几周
}

interface RecurringEventInstance {
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  location?: string;
  color?: string;
  priority?: string;
  allDay: boolean;
  isRecurringInstance: boolean;
  recurrenceId?: string; // 原始事件ID
  instanceDate: string; // 该实例的日期
}

export class RecurrenceService {
  /**
   * 根据重复规则生成事件实例
   */
  static generateRecurringInstances(
    baseEvent: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      location?: string;
      color?: string;
      priority?: string;
      allDay: boolean;
    },
    rule: RecurrenceRule,
    startDate: Date,
    endDate: Date,
    eventId?: string
  ): RecurringEventInstance[] {
    const instances: RecurringEventInstance[] = [];
    const baseStart = new Date(baseEvent.startTime);
    const baseEnd = new Date(baseEvent.endTime);
    const duration = baseEnd.getTime() - baseStart.getTime();

    let currentDate = new Date(startDate);
    let instanceCount = 0;
    const maxInstances = rule.count || 1000; // 最大实例数限制

    // 确保不超过结束日期
    const ruleEndDate = rule.endDate ? new Date(rule.endDate) : endDate;
    const finalEndDate = ruleEndDate < endDate ? ruleEndDate : endDate;

    while (currentDate <= finalEndDate && instanceCount < maxInstances) {
      if (this.shouldGenerateInstance(currentDate, baseStart, rule)) {
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds());
        
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        instances.push({
          startTime: instanceStart.toISOString(),
          endTime: instanceEnd.toISOString(),
          title: baseEvent.title,
          description: baseEvent.description,
          location: baseEvent.location,
          color: baseEvent.color,
          priority: baseEvent.priority,
          allDay: baseEvent.allDay,
          isRecurringInstance: true,
          recurrenceId: eventId,
          instanceDate: currentDate.toISOString().split('T')[0],
        });

        instanceCount++;
      }

      // 移动到下一个可能的日期
      currentDate = this.getNextOccurrence(currentDate, rule);
      
      // 防止无限循环
      if (instanceCount > maxInstances) {
        break;
      }
    }

    return instances;
  }

  /**
   * 判断是否应该在指定日期生成实例
   */
  private static shouldGenerateInstance(
    date: Date,
    baseDate: Date,
    rule: RecurrenceRule
  ): boolean {
    switch (rule.type) {
      case 'daily':
        const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 0 && daysDiff % rule.interval === 0;

      case 'weekly':
        const weeksDiff = Math.floor((date.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const sameWeekday = date.getDay() === baseDate.getDay();
        return weeksDiff >= 0 && weeksDiff % rule.interval === 0 && sameWeekday;

      case 'monthly':
        const monthsDiff = (date.getFullYear() - baseDate.getFullYear()) * 12 + (date.getMonth() - baseDate.getMonth());
        const sameDayOfMonth = date.getDate() === baseDate.getDate();
        return monthsDiff >= 0 && monthsDiff % rule.interval === 0 && sameDayOfMonth;

      case 'yearly':
        const yearsDiff = date.getFullYear() - baseDate.getFullYear();
        const sameMonthAndDay = date.getMonth() === baseDate.getMonth() && date.getDate() === baseDate.getDate();
        return yearsDiff >= 0 && yearsDiff % rule.interval === 0 && sameMonthAndDay;

      default:
        return false;
    }
  }

  /**
   * 获取下一个重复事件的日期
   */
  private static getNextOccurrence(date: Date, rule: RecurrenceRule): Date {
    const nextDate = new Date(date);

    switch (rule.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * rule.interval));
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        break;

      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
        break;
    }

    return nextDate;
  }

  /**
   * 验证重复规则
   */
  static validateRecurrenceRule(rule: RecurrenceRule): string[] {
    const errors: string[] = [];

    if (!rule.type) {
      errors.push('重复类型不能为空');
    }

    if (!rule.interval || rule.interval < 1) {
      errors.push('重复间隔必须大于0');
    }

    if (rule.interval > 365) {
      errors.push('重复间隔不能超过365');
    }

    if (rule.endDate && rule.count && rule.count > 0) {
      errors.push('不能同时设置结束日期和重复次数');
    }

    if (rule.endDate) {
      const endDate = new Date(rule.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('结束日期格式不正确');
      } else if (endDate < new Date()) {
        errors.push('结束日期不能早于当前日期');
      }
    }

    if (rule.count && (rule.count < 1 || rule.count > 999)) {
      errors.push('重复次数必须在1-999之间');
    }

    return errors;
  }

  /**
   * 将表单数据转换为重复规则
   */
  static formDataToRecurrenceRule(formData: {
    recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    recurrenceCount?: number;
  }): RecurrenceRule | null {
    if (!formData.recurrenceType) {
      return null;
    }

    return {
      type: formData.recurrenceType,
      interval: formData.recurrenceInterval || 1,
      endDate: formData.recurrenceEndDate || undefined,
      count: formData.recurrenceCount || undefined,
    };
  }

  /**
   * 描述重复规则的文本
   */
  static describeRecurrenceRule(rule: RecurrenceRule): string {
    let description = '';

    switch (rule.type) {
      case 'daily':
        description = rule.interval === 1 ? '每天' : `每${rule.interval}天`;
        break;
      case 'weekly':
        description = rule.interval === 1 ? '每周' : `每${rule.interval}周`;
        break;
      case 'monthly':
        description = rule.interval === 1 ? '每月' : `每${rule.interval}个月`;
        break;
      case 'yearly':
        description = rule.interval === 1 ? '每年' : `每${rule.interval}年`;
        break;
    }

    if (rule.endDate) {
      description += `，直到${rule.endDate}`;
    } else if (rule.count) {
      description += `，共${rule.count}次`;
    }

    return description;
  }
}

// 导出类型
export type { RecurrenceRule, RecurringEventInstance }; 