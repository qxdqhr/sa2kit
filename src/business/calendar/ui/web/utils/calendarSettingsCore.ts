export const COLOR_THEMES = {
  default: {
    name: '默认主题',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      danger: '#EF4444',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      teal: '#14B8A6',
    },
    background: {
      calendar: '#FFFFFF',
      cell: '#FFFFFF',
      today: '#F5F3FF',
      weekend: '#FFFFFF',
      otherMonth: '#F8FAFC',
    },
    border: {
      calendar: '#E5E7EB',
      cell: '#E5E7EB',
      today: '#7C3AED',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      today: '#5B21B6',
      weekend: '#DC2626',
      otherMonth: '#94A3B8',
    },
  },
  dark: {
    name: '深色主题',
    colors: {
      primary: '#60A5FA',
      secondary: '#34D399',
      accent: '#FBBF24',
      danger: '#F87171',
      purple: '#A78BFA',
      pink: '#F472B6',
      indigo: '#818CF8',
      teal: '#2DD4BF',
    },
    background: {
      calendar: '#1F2937',
      cell: '#374151',
      today: '#312E81',
      weekend: '#374151',
      otherMonth: '#1F2937',
    },
    border: {
      calendar: '#4B5563',
      cell: '#4B5563',
      today: '#818CF8',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      today: '#E0E7FF',
      weekend: '#FCA5A5',
      otherMonth: '#6B7280',
    },
  },
  colorful: {
    name: '彩色主题',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      danger: '#EF4444',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      teal: '#14B8A6',
    },
    background: {
      calendar: '#FFFFFF',
      cell: '#FEF3C7',
      today: '#EDE9FE',
      weekend: '#FEE2E2',
      otherMonth: '#F3F4F6',
    },
    border: {
      calendar: '#D1D5DB',
      cell: '#D1D5DB',
      today: '#8B5CF6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      today: '#5B21B6',
      weekend: '#DC2626',
      otherMonth: '#9CA3AF',
    },
  },
} as const;

export type CalendarThemeKey = keyof typeof COLOR_THEMES;

export interface CalendarSettings {
  theme: CalendarThemeKey;
  weekStartsOn: number;
  timeFormat: '12h' | '24h';
  language: string;
  showWeekNumbers: boolean;
  showLunarCalendar: boolean;
  defaultEventDuration: number;
  workingHours: {
    start: string;
    end: string;
  };
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  theme: 'default',
  weekStartsOn: 1,
  timeFormat: '24h',
  language: 'zh-CN',
  showWeekNumbers: false,
  showLunarCalendar: false,
  defaultEventDuration: 60,
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
};

export const CALENDAR_SETTINGS_STORAGE_KEY = 'calendar-settings';

export function loadCalendarSettings(): CalendarSettings {
  if (typeof window === 'undefined') return DEFAULT_CALENDAR_SETTINGS;
  try {
    const raw = localStorage.getItem(CALENDAR_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_CALENDAR_SETTINGS;
    return { ...DEFAULT_CALENDAR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CALENDAR_SETTINGS;
  }
}

export function saveCalendarSettings(settings: CalendarSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CALENDAR_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resolveTheme(settings: CalendarSettings) {
  return COLOR_THEMES[settings.theme] ?? COLOR_THEMES.default;
}

export function getThemeCssProperties(settings: CalendarSettings): Record<string, string> {
  const theme = resolveTheme(settings);
  return {
    '--cal-primary': theme.colors.primary,
    '--cal-bg': theme.background.calendar,
    '--cal-cell-bg': theme.background.cell,
    '--cal-today-bg': theme.background.today,
    '--cal-weekend-bg': theme.background.weekend,
    '--cal-other-month-bg': theme.background.otherMonth,
    '--cal-text': theme.text.primary,
    '--cal-text-muted': theme.text.secondary,
    '--cal-today-text': theme.text.today,
    '--cal-weekend-text': theme.text.weekend,
  };
}

export function formatTimeForSettings(date: Date, settings: CalendarSettings): string {
  return date.toLocaleTimeString(settings.language, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12h',
  });
}

export function buildDefaultEventTimes(
  date: Date,
  settings: CalendarSettings
): { start: Date; end: Date } {
  const [startHour, startMinute] = settings.workingHours.start.split(':').map(Number);
  const start = new Date(date);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + settings.defaultEventDuration);
  return { start, end };
}

export function getISOWeekNumber(date: Date): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

export function getLunarDayLabel(date: Date, language: string): string | null {
  try {
    const locale = language.startsWith('zh') ? 'zh-u-ca-chinese' : language;
    return date.toLocaleDateString(locale, { day: 'numeric' });
  } catch {
    return null;
  }
}

export function isWeekendColumn(dayIndex: number, weekStartsOn: number): boolean {
  const dayOfWeek = (weekStartsOn + dayIndex) % 7;
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function formatDateForSettings(date: Date, settings: CalendarSettings): string {
  return date.toLocaleDateString(settings.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatViewTitleMonth(date: Date, settings: CalendarSettings): string {
  return date.toLocaleDateString(settings.language, { year: 'numeric', month: 'long' });
}

export function formatViewTitleDay(date: Date, settings: CalendarSettings): string {
  return date.toLocaleDateString(settings.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
