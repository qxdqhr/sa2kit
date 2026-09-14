'use client'

import React, { useMemo, useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DateCalculatorMode, DateShiftUnit } from '../../../domain/types'
import {
  computeInterval,
  formatYmd,
  shiftDate,
  todayYmd,
} from '../../../domain'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MODES: { id: DateCalculatorMode; label: string; hint: string }[] = [
  { id: 'interval', label: '日期间隔', hint: '计算两个日期之间相差多久' },
  { id: 'shift', label: '日期推算', hint: '在指定日期上加减一段时间' },
]

const UNITS: { id: DateShiftUnit; label: string }[] = [
  { id: 'day', label: '天' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'year', label: '年' },
]

export type DateCalculatorToolProps = {
  /** page：独立整页；embedded：嵌入日历等容器，不铺全屏背景 */
  variant?: 'page' | 'embedded'
  className?: string
}

export default function DateCalculatorTool({
  variant = 'page',
  className = '',
}: DateCalculatorToolProps) {
  const embedded = variant === 'embedded'
  const [mode, setMode] = useState<DateCalculatorMode>('interval')
  const [startDate, setStartDate] = useState(todayYmd())
  const [endDate, setEndDate] = useState(todayYmd())
  const [baseDate, setBaseDate] = useState(todayYmd())
  const [shiftAmount, setShiftAmount] = useState(7)
  const [shiftUnit, setShiftUnit] = useState<DateShiftUnit>('day')

  const interval = useMemo(
    () => computeInterval(startDate, endDate),
    [startDate, endDate]
  )

  const shifted = useMemo(
    () => shiftDate(baseDate, shiftAmount, shiftUnit),
    [baseDate, shiftAmount, shiftUnit]
  )

  const swapIntervalDates = () => {
    setStartDate(endDate)
    setEndDate(startDate)
  }

  return (
    <div
      className={
        embedded
          ? cn('relative flex h-full min-h-0 flex-col', className)
          : cn(
              'relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-50 via-violet-50/40 to-indigo-100/60 px-4 py-8 sm:py-12',
              className,
            )
      }
    >
      {!embedded && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.22) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      )}
      <div className={embedded ? 'relative mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col' : 'relative mx-auto max-w-3xl'}>
        {!embedded && (
          <header className="mb-8 text-center sm:mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600/80">
              Pencil · Studio
            </p>
            <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              日期计算器
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-600 sm:text-base">
              间隔与推算两种模式，本地即时计算；与日历模块共用 Pencil 风格界面。
            </p>
          </header>
        )}

        <div
          className={
            embedded
              ? 'mb-4 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
              : 'mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center'
          }
        >
          <div
            className={
              embedded
                ? 'inline-flex min-w-full w-max rounded-2xl border border-white/70 bg-white/50 p-1 shadow-sm backdrop-blur-md sm:min-w-0 sm:w-auto'
                : 'inline-flex w-full rounded-2xl border border-white/70 bg-white/50 p-1 shadow-sm backdrop-blur-md sm:w-auto'
            }
            role="tablist"
            aria-label="计算模式"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none sm:px-5 ${
                  mode === m.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {!embedded && (
            <p className="text-center text-xs text-slate-500 sm:max-w-xs sm:text-left">
              {MODES.find((m) => m.id === mode)?.hint}
            </p>
          )}
        </div>

        <div
          className={
            embedded
              ? 'min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
              : undefined
          }
        >
        {mode === 'interval' && (
          <section className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-indigo-950/5 backdrop-blur-md sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <label className="flex-1 text-left">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  开始日期
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-3 text-sm text-slate-900 shadow-inner outline-none ring-violet-500/0 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <div className="flex justify-center sm:pb-1">
                <button
                  type="button"
                  onClick={swapIntervalDates}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
                >
                  交换
                </button>
              </div>
              <label className="flex-1 text-left">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  结束日期
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-3 text-sm text-slate-900 shadow-inner outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = todayYmd()
                  setStartDate(t)
                  setEndDate(t)
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              >
                今天 → 今天
              </button>
              <button
                type="button"
                onClick={() => setStartDate(todayYmd())}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              >
                开始设为今天
              </button>
              <button
                type="button"
                onClick={() => setEndDate(todayYmd())}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              >
                结束设为今天
              </button>
            </div>

            {interval && (
              <div className="mt-8 space-y-6">
                {interval.isNegative && (
                  <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                    结束日期早于开始日期；下方间隔与分解均为绝对值，方向以总天数前的符号为准。
                  </p>
                )}
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-indigo-50/80 p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-700/80">
                    总间隔（按自然日）
                  </p>
                  <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
                    {interval.isNegative ? '−' : ''}
                    {interval.totalDays}
                    <span className="ml-2 text-lg font-sans font-medium text-slate-600 sm:text-xl">
                      天
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    约合{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {interval.totalWeeks}
                    </span>{' '}
                    周又{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {interval.remainderDaysAfterWeeks}
                    </span>{' '}
                    天
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                    日历分解（非累计近似）
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {(
                      [
                        ['年', interval.breakdown.years],
                        ['月', interval.breakdown.months],
                        ['日', interval.breakdown.days],
                      ] as const
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-100 bg-white/90 px-3 py-4 text-center shadow-sm"
                      >
                        <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
                          {value}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {mode === 'shift' && (
          <section className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-indigo-950/5 backdrop-blur-md sm:p-8">
            <label className="block text-left">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                基准日期
              </span>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-3 text-sm text-slate-900 shadow-inner outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 sm:max-w-xs"
              />
            </label>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex-1 text-left">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  偏移量（可为负数）
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(shiftAmount) ? '' : shiftAmount}
                  onChange={(e) => setShiftAmount(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-3 font-mono text-sm text-slate-900 shadow-inner outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <fieldset className="flex-1">
                <legend className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  单位
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {UNITS.map((u) => (
                    <label
                      key={u.id}
                      className={`flex cursor-pointer items-center justify-center rounded-2xl border px-2 py-2.5 text-center text-xs font-medium transition ${
                        shiftUnit === u.id
                          ? 'border-violet-500 bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shift-unit"
                        className="sr-only"
                        checked={shiftUnit === u.id}
                        onChange={() => setShiftUnit(u.id)}
                      />
                      {u.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <button
              type="button"
              onClick={() => setBaseDate(todayYmd())}
              className="mt-4 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
            >
              基准设为今天
            </button>

            {shifted && (
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-violet-50/80 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-700/80">
                  结果日期
                </p>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
                  {formatYmd(shifted)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {shiftAmount >= 0 ? '向后' : '向前'}{' '}
                  {Math.abs(shiftAmount)} {UNITS.find((u) => u.id === shiftUnit)?.label}
                </p>
              </div>
            )}
          </section>
        )}

        {!embedded && (
          <footer className="mt-10 text-center text-xs text-slate-500">
            使用本机日期；跨年与大小月由 dayjs 按日历规则处理。
          </footer>
        )}
        </div>
      </div>
    </div>
  )
}
