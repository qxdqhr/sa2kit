'use client';

import React, { useMemo } from 'react';
import type { ScheduleDayInfo } from '../../../../domain/types';
import {
  formatCalendarDate,
  getMonthViewDates,
  getWeekdayShortLabels,
} from '../../../../domain/utils/calendarDateUtils';
import { FitnessCalendarCell } from './FitnessCalendarCell';

interface FitnessMonthViewProps {
  monthKey: string;
  days: ScheduleDayInfo[];
  selectedDate?: string;
  onDateClick?: (date: Date) => void;
}

export function FitnessMonthView({
  monthKey,
  days,
  selectedDate,
  onDateClick,
}: FitnessMonthViewProps) {
  const [year, month] = monthKey.split('-').map(Number);
  const anchor = new Date(year, month - 1, 1);

  const gridDates = useMemo(() => getMonthViewDates(anchor, 1), [anchor]);
  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const weekLabels = getWeekdayShortLabels(1);

  return (
    <div className="fp-cal-month">
      <div className="fp-cal-month__weekdays">
        {weekLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="fp-cal-month__grid">
        {gridDates.map((date) => {
          const dateKey = formatCalendarDate(date);
          return (
            <FitnessCalendarCell
              key={dateKey}
              date={date}
              dateKey={dateKey}
              isCurrentMonth={date.getMonth() === anchor.getMonth()}
              dayInfo={dayMap.get(dateKey)}
              isSelected={selectedDate === dateKey}
              onClick={onDateClick}
            />
          );
        })}
      </div>
    </div>
  );
}
