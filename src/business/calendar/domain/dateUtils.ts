export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function parseLocalISOString(value: string): Date {
  const trimmed = value.trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const [datePart, timePart = '00:00:00'] = trimmed.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const timeSegments = timePart.split(':');
  const hours = Number(timeSegments[0]) || 0;
  const minutes = Number(timeSegments[1]) || 0;
  const secPart = timeSegments[2] ?? '0';
  const [seconds, ms = '0'] = secPart.split('.');

  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    Number(seconds) || 0,
    Number(ms) || 0,
  );
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getWeekStart(date: Date, firstDayOfWeek = 1): Date {
  const day = date.getDay();
  const diff = day - firstDayOfWeek;
  const adjustedDiff = diff < 0 ? diff + 7 : diff;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - adjustedDiff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function getDayStart(date: Date): Date {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
}

export function getDayEnd(date: Date): Date {
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return dayEnd;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getMonthViewDates(date: Date, firstDayOfWeek = 1): Date[] {
  const monthStart = getMonthStart(date);
  const viewStart = getWeekStart(monthStart, firstDayOfWeek);
  const dates: Date[] = [];
  let currentDate = new Date(viewStart);
  for (let i = 0; i < 42; i += 1) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function allDayBoundsFromDate(date: Date): { start: Date; end: Date } {
  return { start: getDayStart(date), end: getDayEnd(date) };
}

const DEFAULT_MIN_EVENT_DURATION_MS = 60 * 60 * 1000;

export function ensureEndAfterStart(
  startTime: Date,
  endTime: Date,
  minDurationMs = DEFAULT_MIN_EVENT_DURATION_MS,
): { startTime: Date; endTime: Date } {
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return { startTime, endTime };
  }
  if (endTime.getTime() > startTime.getTime()) {
    return { startTime, endTime };
  }
  return {
    startTime,
    endTime: new Date(startTime.getTime() + minDurationMs),
  };
}

export function formatViewTitleMonth(date: Date, locale = 'zh-CN'): string {
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
