import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { DateBreakdown, DateShiftUnit, IntervalResult } from './types'

dayjs.extend(customParseFormat)

const DATE_FMT = 'YYYY-MM-DD'

export function parseYmd(ymd: string): dayjs.Dayjs | null {
  if (!ymd) return null
  const d = dayjs(ymd, DATE_FMT, true)
  return d.isValid() ? d.startOf('day') : null
}

export function formatYmd(d: dayjs.Dayjs): string {
  return d.format(DATE_FMT)
}

export function todayYmd(): string {
  return dayjs().startOf('day').format(DATE_FMT)
}

/** 将结束日相对起始日的差分解为 年 / 月 / 日（均为非负，且 end >= start 时 isNegative 为 false） */
export function calendarBreakdown(
  start: dayjs.Dayjs,
  end: dayjs.Dayjs
): { breakdown: DateBreakdown; isNegative: boolean } {
  const neg = end.isBefore(start)
  const a = (neg ? end : start).startOf('day')
  const b = (neg ? start : end).startOf('day')

  let cursor = a.clone()
  const years = b.diff(cursor, 'year')
  cursor = cursor.add(years, 'year')
  const months = b.diff(cursor, 'month')
  cursor = cursor.add(months, 'month')
  const days = b.diff(cursor, 'day')

  return {
    breakdown: { years, months, days },
    isNegative: neg,
  }
}

export function computeInterval(
  startYmd: string,
  endYmd: string
): IntervalResult | null {
  const start = parseYmd(startYmd)
  const end = parseYmd(endYmd)
  if (!start || !end) return null

  const totalDays = Math.abs(end.diff(start, 'day'))
  const { breakdown, isNegative } = calendarBreakdown(start, end)
  const totalWeeks = Math.floor(totalDays / 7)
  const remainderDaysAfterWeeks = totalDays % 7

  return {
    totalDays,
    totalWeeks,
    remainderDaysAfterWeeks,
    breakdown,
    isNegative,
  }
}

export function shiftDate(
  baseYmd: string,
  amount: number,
  unit: DateShiftUnit
): dayjs.Dayjs | null {
  const base = parseYmd(baseYmd)
  if (!base) return null
  if (!Number.isFinite(amount)) return null
  return base.add(amount, unit).startOf('day')
}
