export * from './schema';
export * from './calendarDbService';

export const DEFAULT_CALENDAR_CONFIG = {
  firstDayOfWeek: 1,
  workingHours: {
    start: '09:00',
    end: '18:00',
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
    gray: '#6B7280',
  },
};
