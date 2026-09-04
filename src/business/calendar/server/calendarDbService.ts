import { and, eq, gte, lte, desc, asc } from 'drizzle-orm';
import {
  calendarEvents,
  recurrenceRules,
  reminders,
  calendarConfigs,
} from './schema';

export type CalendarDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

export class CalendarDbService {
  constructor(private readonly db: CalendarDrizzleDb) {}

  async getAllEvents(userId: string, startDate?: Date, endDate?: Date) {
    const conditions = [eq(calendarEvents.userId, userId)];

    if (startDate) {
      conditions.push(gte(calendarEvents.endTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(calendarEvents.startTime, endDate));
    }

    return this.db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(asc(calendarEvents.startTime));
  }

  async getEventById(eventId: number) {
    const [event] = await this.db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);
    return event || null;
  }

  async createEvent(eventData: {
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    location?: string | null;
    color: string;
    userId: string;
    priority?: string;
  }) {
    const [newEvent] = await this.db.insert(calendarEvents).values(eventData).returning();
    return newEvent;
  }

  async updateEvent(
    eventId: number,
    eventData: {
      title?: string;
      description?: string | null;
      startTime?: Date;
      endTime?: Date;
      allDay?: boolean;
      location?: string | null;
      color?: string;
      priority?: string;
    },
  ) {
    const [updatedEvent] = await this.db
      .update(calendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, eventId))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
  }

  async getUserConfig(userId: string) {
    const [config] = await this.db
      .select()
      .from(calendarConfigs)
      .where(eq(calendarConfigs.userId, userId))
      .limit(1);
    return config || null;
  }

  async upsertUserConfig(
    userId: string,
    configData: {
      firstDayOfWeek?: number;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      timeZone?: string;
      dateFormat?: string;
      timeFormat?: string;
      defaultView?: string;
      defaultEventColor?: string;
      weekends?: boolean;
      eventColors?: Record<string, string>;
    },
  ) {
    const existingConfig = await this.getUserConfig(userId);
    if (existingConfig) {
      const [updatedConfig] = await this.db
        .update(calendarConfigs)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(calendarConfigs.userId, userId))
        .returning();
      return updatedConfig;
    }
    const [newConfig] = await this.db
      .insert(calendarConfigs)
      .values({ userId, ...configData })
      .returning();
    return newConfig;
  }

  async createRecurrenceRule(ruleData: {
    eventId: number;
    ruleType: string;
    interval: number;
    endDate?: Date;
    count?: number;
    byWeekday?: number[];
    byMonthday?: number[];
    byMonth?: number[];
  }) {
    const [newRule] = await this.db.insert(recurrenceRules).values(ruleData).returning();
    return newRule;
  }

  async getRecurrenceRule(eventId: number) {
    const [rule] = await this.db
      .select()
      .from(recurrenceRules)
      .where(eq(recurrenceRules.eventId, eventId))
      .limit(1);
    return rule || null;
  }

  async deleteRecurrenceRule(eventId: number): Promise<void> {
    await this.db.delete(recurrenceRules).where(eq(recurrenceRules.eventId, eventId));
  }

  async createReminder(reminderData: {
    eventId: number;
    reminderTime: Date;
    reminderType: string;
    status?: string;
  }) {
    const [newReminder] = await this.db
      .insert(reminders)
      .values({
        ...reminderData,
        status: reminderData.status || 'pending',
      })
      .returning();
    return newReminder;
  }

  async getEventReminders(eventId: number) {
    return this.db
      .select()
      .from(reminders)
      .where(eq(reminders.eventId, eventId))
      .orderBy(asc(reminders.reminderTime));
  }

  async deleteEventReminders(eventId: number): Promise<void> {
    await this.db.delete(reminders).where(eq(reminders.eventId, eventId));
  }

  async getEventCount(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const conditions = [eq(calendarEvents.userId, userId)];
    if (startDate) conditions.push(gte(calendarEvents.startTime, startDate));
    if (endDate) conditions.push(lte(calendarEvents.endTime, endDate));
    const result = await this.db
      .select({ count: calendarEvents.id })
      .from(calendarEvents)
      .where(and(...conditions));
    return result.length;
  }

  async searchEvents(userId: string, searchTerm: string) {
    const events = await this.db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .orderBy(desc(calendarEvents.startTime));
    const needle = searchTerm.toLowerCase();
    return events.filter(
      (event: { title: string; description?: string | null }) =>
        event.title.toLowerCase().includes(needle) ||
        (event.description && event.description.toLowerCase().includes(needle)),
    );
  }

  async deleteAllUserEvents(userId: string): Promise<void> {
    await this.db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
  }
}

export function createCalendarDbService(db: CalendarDrizzleDb) {
  return new CalendarDbService(db);
}
