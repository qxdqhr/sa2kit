/**
 * 健身日历日期工具（自 calendar 模块复制精简版）
 */

export function formatCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameCalendarDay(date, new Date());
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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

export function getMonthViewDates(date: Date, firstDayOfWeek = 1): Date[] {
  const monthStart = getMonthStart(date);
  const viewStart = getWeekStart(monthStart, firstDayOfWeek);
  const dates: Date[] = [];
  const current = new Date(viewStart);
  for (let i = 0; i < 42; i += 1) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getWeekdayShortLabels(firstDayOfWeek = 1): string[] {
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  if (firstDayOfWeek === 1) {
    return ['一', '二', '三', '四', '五', '六', '日'].map((d) => `周${d}`);
  }
  return labels.map((d) => `周${d}`);
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split('-').map(Number);
  return { year: y, month: m };
}

export function shiftMonth(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthTitle(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return `${year}年${month}月`;
}
