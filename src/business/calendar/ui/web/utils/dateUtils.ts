/**
 * 日历日期工具函数
 * 
 * 提供日历模块中常用的日期处理功能，包括：
 * - 日期格式化
 * - 日期计算
 * - 日历视图相关的日期逻辑
 * - 重复事件计算
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * 使用本地时区，避免时区转换问题
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:mm 格式
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * 格式化日期时间为本地字符串
 */
export function formatDateTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  return date.toLocaleString('zh-CN', { ...defaultOptions, ...options });
}

/**
 * 将日期时间转换为ISO字符串，但保持本地时区
 * 避免时区转换导致的日期偏移问题
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  // 不添加Z后缀，避免被误认为是UTC时间
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/** API 传输时使用的固定时区偏移（与 calendarConfigs.timeZone 默认一致） */
export const CALENDAR_WIRE_TIMEZONE_OFFSET = '+08:00';

const DEFAULT_MIN_EVENT_DURATION_MS = 60 * 60 * 1000;

function normalizeTimePartForWire(timePart: string): string {
  const segments = timePart.split(':');
  const hours = segments[0] ?? '00';
  const minutes = segments[1] ?? '00';
  const secPart = segments[2] ?? '00';
  const [seconds, ms = '000'] = secPart.split('.');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.${ms.padEnd(3, '0').slice(0, 3)}`;
}

/**
 * 解析 API 请求体中的本地时间字符串（固定东八区）
 * 避免 Docker/Node 以 UTC 解析导致日期写入错误。
 */
export function parseWireLocalISOString(
  value: string,
  offset: string = CALENDAR_WIRE_TIMEZONE_OFFSET
): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const [datePart, timePart = '00:00:00'] = trimmed.split('T');
  const normalizedTime = normalizeTimePartForWire(timePart);
  return new Date(`${datePart}T${normalizedTime}${offset}`);
}

/**
 * 解析无时区后缀的本地时间字符串（与 toLocalISOString 配对）
 * 浏览器端使用系统本地时区；服务端解析 wire 格式请用 parseWireLocalISOString。
 */
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
    Number(ms) || 0
  );
}

/**
 * 解析活动日期时间（AI 输出 / 用户输入）
 * - 仅日期 YYYY-MM-DD → 本地当天 00:00
 * - 带 Z 或 offset → 标准解析后转本地分量重建（避免显示偏移）
 */
export function parseEventDateTime(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return parsed;
    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes(),
      parsed.getSeconds(),
      parsed.getMilliseconds()
    );
  }

  return parseLocalISOString(trimmed);
}

/**
 * 全天活动的起止时间（本地日界）
 */
export function allDayBoundsFromDate(date: Date): { start: Date; end: Date } {
  const start = getDayStart(date);
  const end = getDayEnd(date);
  return { start, end };
}

/**
 * 保证结束时间晚于开始时间；若用户只改了开始日期，按原时长顺延结束时间。
 */
export function ensureEndAfterStart(
  startTime: Date,
  endTime: Date,
  minDurationMs: number = DEFAULT_MIN_EVENT_DURATION_MS
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

/**
 * 获取月份的第一天
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 获取周的第一天（基于指定的一周开始日）
 */
export function getWeekStart(date: Date, firstDayOfWeek: number = 1): Date {
  const day = date.getDay();
  const diff = day - firstDayOfWeek;
  const adjustedDiff = diff < 0 ? diff + 7 : diff;
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - adjustedDiff);
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

/**
 * 获取周的最后一天
 */
export function getWeekEnd(date: Date, firstDayOfWeek: number = 1): Date {
  const weekStart = getWeekStart(date, firstDayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return weekEnd;
}

/**
 * 获取当天的开始时间
 */
export function getDayStart(date: Date): Date {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
}

/**
 * 获取当天的结束时间
 */
export function getDayEnd(date: Date): Date {
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return dayEnd;
}

/**
 * 检查两个日期是否在同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 检查两个日期是否在同一周
 */
export function isSameWeek(date1: Date, date2: Date, firstDayOfWeek: number = 1): boolean {
  const week1Start = getWeekStart(date1, firstDayOfWeek);
  const week2Start = getWeekStart(date2, firstDayOfWeek);
  
  return isSameDay(week1Start, week2Start);
}

/**
 * 检查两个日期是否在同一月
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
}

/**
 * 检查日期是否是今天
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 检查日期是否是周末
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 周日或周六
}

/**
 * 添加天数
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 添加周数
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * 添加月数
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 添加年数
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * 获取月视图的日期网格
 */
export function getMonthViewDates(date: Date, firstDayOfWeek: number = 1): Date[] {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const viewStart = getWeekStart(monthStart, firstDayOfWeek);
  
  const dates: Date[] = [];
  let currentDate = new Date(viewStart);
  
  // 确保总是生成6周（42天）的日期
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * 获取周视图的日期
 */
export function getWeekViewDates(date: Date, firstDayOfWeek: number = 1): Date[] {
  const weekStart = getWeekStart(date, firstDayOfWeek);
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    dates.push(currentDate);
  }
  
  return dates;
}

/**
 * 生成时间槽（用于日视图和周视图）
 */
export function generateTimeSlots(startHour: number = 0, endHour: number = 24, interval: number = 60): Date[] {
  const today = new Date();
  const slots: Date[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const slot = new Date(today);
      slot.setHours(hour, minute, 0, 0);
      slots.push(slot);
    }
  }
  
  return slots;
}

/**
 * 解析日期字符串为Date对象
 */
export function parseDate(dateString: string): Date {
  // 支持多种日期格式
  if (dateString.includes('T')) {
    // ISO 格式
    return new Date(dateString);
  } else if (dateString.includes('-')) {
    // YYYY-MM-DD 格式
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } else {
    // 其他格式，使用默认解析
    return new Date(dateString);
  }
}

/**
 * 获取两个日期之间的天数差
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * 检查时间是否在工作时间内
 */
export function isWorkingHour(date: Date, workingStart: string = '09:00', workingEnd: string = '18:00'): boolean {
  const timeString = formatTime(date);
  return timeString >= workingStart && timeString <= workingEnd;
}

/**
 * 获取月份名称
 */
export function getMonthName(date: Date, locale: string = 'zh-CN'): string {
  return date.toLocaleDateString(locale, { month: 'long' });
}

/**
 * 获取星期名称
 */
export function getWeekdayName(date: Date, locale: string = 'zh-CN', format: 'long' | 'short' | 'narrow' = 'long'): string {
  return date.toLocaleDateString(locale, { weekday: format });
}

/**
 * 获取相对时间描述（如"2小时前"、"明天"）
 */
export function getRelativeTime(date: Date, locale: string = 'zh-CN'): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    if (isSameDay(date, now)) {
      return '今天';
    }
  } else if (diffInDays === 1) {
    return '明天';
  } else if (diffInDays === -1) {
    return '昨天';
  } else if (diffInDays > 1 && diffInDays <= 7) {
    return `${diffInDays}天后`;
  } else if (diffInDays < -1 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)}天前`;
  }
  
  // 对于更远的日期，返回格式化的日期
  return formatDate(date);
}

/**
 * 验证日期是否有效
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 克隆日期对象
 */
export function cloneDate(date: Date): Date {
  return new Date(date.getTime());
} 