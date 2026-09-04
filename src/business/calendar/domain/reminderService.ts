import { CalendarEvent } from './types';

interface ReminderConfig {
  minutes: number; // 提前多少分钟提醒
  type: 'browser' | 'email' | 'sms' | 'sound';
  enabled: boolean;
}

interface ScheduledReminder {
  id: string;
  eventId: number;
  eventTitle: string;
  reminderTime: Date;
  config: ReminderConfig;
  status: 'pending' | 'sent' | 'failed';
}

export class ReminderService {
  private static reminders: Map<string, ScheduledReminder> = new Map();
  private static notificationPermission: NotificationPermission = 'default';

  /**
   * 初始化提醒服务
   */
  static async initialize(): Promise<void> {
    // 请求通知权限
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }

    // 检查并触发到期的提醒
    this.checkPendingReminders();
    
    // 每分钟检查一次提醒
    setInterval(() => {
      this.checkPendingReminders();
    }, 60000);
  }

  /**
   * 为事件创建提醒
   */
  static createReminder(
    event: CalendarEvent,
    reminderMinutes: number,
    reminderType: 'browser' | 'email' | 'sms' | 'sound' = 'browser'
  ): string {
    const reminderId = `${event.id}_${Date.now()}`;
    const eventStart = new Date(event.startTime);
    const reminderTime = new Date(eventStart.getTime() - (reminderMinutes * 60 * 1000));

    const reminder: ScheduledReminder = {
      id: reminderId,
      eventId: event.id,
      eventTitle: event.title,
      reminderTime,
      config: {
        minutes: reminderMinutes,
        type: reminderType,
        enabled: true,
      },
      status: 'pending',
    };

    this.reminders.set(reminderId, reminder);
    
    // 如果提醒时间已经过了，立即触发
    if (reminderTime <= new Date()) {
      this.triggerReminder(reminder);
    }

    return reminderId;
  }

  /**
   * 删除提醒
   */
  static deleteReminder(reminderId: string): boolean {
    return this.reminders.delete(reminderId);
  }

  /**
   * 删除事件的所有提醒
   */
  static deleteEventReminders(eventId: number): void {
    for (const [id, reminder] of this.reminders.entries()) {
      if (reminder.eventId === eventId) {
        this.reminders.delete(id);
      }
    }
  }

  /**
   * 检查并触发到期的提醒
   */
  private static checkPendingReminders(): void {
    const now = new Date();
    
    for (const reminder of this.reminders.values()) {
      if (reminder.status === 'pending' && reminder.reminderTime <= now) {
        this.triggerReminder(reminder);
      }
    }
  }

  /**
   * 触发提醒
   */
  private static async triggerReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      switch (reminder.config.type) {
        case 'browser':
          await this.sendBrowserNotification(reminder);
          break;
        case 'email':
          await this.sendEmailReminder(reminder);
          break;
        case 'sms':
          await this.sendSmsReminder(reminder);
          break;
        case 'sound':
          await this.playSoundReminder(reminder);
          break;
      }
      
      reminder.status = 'sent';
    } catch (error) {
      console.error('Failed to send reminder:', error);
      reminder.status = 'failed';
    }
  }

  /**
   * 发送浏览器通知
   */
  private static async sendBrowserNotification(reminder: ScheduledReminder): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const timeText = this.getTimeText(reminder.config.minutes);
    const notification = new Notification(`📅 事件提醒`, {
      body: `${reminder.eventTitle}\n${timeText}`,
      icon: '/favicon.ico',
      tag: reminder.id,
      requireInteraction: true,
    });

    // 点击通知时的处理
    notification.onclick = () => {
      window.focus();
      notification.close();
      // 可以添加跳转到日历页面的逻辑
    };

    // 自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  /**
   * 发送邮件提醒
   */
  private static async sendEmailReminder(reminder: ScheduledReminder): Promise<void> {
    // 这里应该调用后端邮件服务API
    console.log('Email reminder would be sent:', reminder);
    
    // 示例API调用
    // const response = await fetch('/api/send-email-reminder', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     eventTitle: reminder.eventTitle,
    //     reminderMinutes: reminder.config.minutes,
    //   }),
    // });
    
    // if (!response.ok) {
    //   throw new Error('Failed to send email reminder');
    // }
  }

  /**
   * 发送短信提醒
   */
  private static async sendSmsReminder(reminder: ScheduledReminder): Promise<void> {
    // 这里应该调用后端短信服务API
    console.log('SMS reminder would be sent:', reminder);
    
    // 示例API调用
    // const response = await fetch('/api/send-sms-reminder', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     eventTitle: reminder.eventTitle,
    //     reminderMinutes: reminder.config.minutes,
    //   }),
    // });
    
    // if (!response.ok) {
    //   throw new Error('Failed to send SMS reminder');
    // }
  }

  /**
   * 播放声音提醒
   */
  private static async playSoundReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      // 创建一个简单的提醒音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // 显示视觉提醒
      this.showVisualAlert(reminder);
    } catch (error) {
      console.error('Failed to play sound reminder:', error);
      // 降级到视觉提醒
      this.showVisualAlert(reminder);
    }
  }

  /**
   * 显示视觉提醒
   */
  private static showVisualAlert(reminder: ScheduledReminder): void {
    const timeText = this.getTimeText(reminder.config.minutes);
    alert(`📅 事件提醒\n\n${reminder.eventTitle}\n${timeText}`);
  }

  /**
   * 获取时间描述文本
   */
  private static getTimeText(minutes: number): string {
    if (minutes === 0) {
      return '事件即将开始';
    } else if (minutes < 60) {
      return `${minutes}分钟后开始`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}小时${remainingMinutes}分钟后开始`
        : `${hours}小时后开始`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0
        ? `${days}天${remainingHours}小时后开始`
        : `${days}天后开始`;
    }
  }

  /**
   * 获取所有提醒
   */
  static getAllReminders(): ScheduledReminder[] {
    return Array.from(this.reminders.values());
  }

  /**
   * 获取事件的提醒
   */
  static getEventReminders(eventId: number): ScheduledReminder[] {
    return Array.from(this.reminders.values()).filter(
      reminder => reminder.eventId === eventId
    );
  }

  /**
   * 智能推荐提醒时间
   */
  static getSmartReminderSuggestions(event: CalendarEvent): number[] {
    const suggestions: number[] = [];
    const eventStart = new Date(event.startTime);
    const now = new Date();
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 根据事件类型和时间距离智能推荐
    if (event.allDay) {
      // 全天事件：提前更长时间
      suggestions.push(1440, 720, 60); // 1天、12小时、1小时
    } else {
      // 普通事件：根据距离时间推荐
      if (hoursUntilEvent > 24) {
        suggestions.push(1440, 60, 15); // 1天、1小时、15分钟
      } else if (hoursUntilEvent > 2) {
        suggestions.push(60, 30, 15); // 1小时、30分钟、15分钟
      } else {
        suggestions.push(30, 15, 5); // 30分钟、15分钟、5分钟
      }
    }

    // 根据优先级调整
    if (event.priority === 'urgent') {
      suggestions.unshift(0); // 紧急事件添加即时提醒
    }

    // 去重并排序
    return [...new Set(suggestions)].sort((a, b) => b - a);
  }

  /**
   * 批量创建智能提醒
   */
  static createSmartReminders(event: CalendarEvent): string[] {
    const suggestions = this.getSmartReminderSuggestions(event);
    const reminderIds: string[] = [];

    // 自动创建推荐的提醒
    suggestions.slice(0, 2).forEach(minutes => { // 只创建前两个推荐
      const reminderId = this.createReminder(event, minutes, 'browser');
      reminderIds.push(reminderId);
    });

    return reminderIds;
  }
}

// 导出类型
export type { ReminderConfig, ScheduledReminder }; 