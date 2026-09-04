export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CalendarViewType {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda',
}

export enum EventColor {
  BLUE = '#3B82F6',
  GREEN = '#10B981',
  PURPLE = '#8B5CF6',
  RED = '#EF4444',
  YELLOW = '#F59E0B',
  PINK = '#EC4899',
  INDIGO = '#6366F1',
  GRAY = '#6B7280',
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string | null;
  color: string;
  priority: EventPriority;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  color: string;
  priority: EventPriority;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  color: string;
  priority: EventPriority;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  priority?: EventPriority;
}

export type ApiEnvelope<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; detail?: string };
