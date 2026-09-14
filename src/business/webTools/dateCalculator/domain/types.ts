export type DateCalculatorMode = 'interval' | 'shift'

export type DateShiftUnit = 'day' | 'week' | 'month' | 'year'

export interface DateBreakdown {
  years: number
  months: number
  days: number
}

export interface IntervalResult {
  totalDays: number
  totalWeeks: number
  remainderDaysAfterWeeks: number
  breakdown: DateBreakdown
  isNegative: boolean
}
