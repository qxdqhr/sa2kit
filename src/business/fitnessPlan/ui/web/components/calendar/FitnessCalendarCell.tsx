'use client';

import React from 'react';

import type { ScheduleDayInfo } from '../../../../domain/types';
import { isToday } from '../../../../domain/utils/calendarDateUtils';

interface FitnessCalendarCellProps {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  dayInfo?: ScheduleDayInfo;
  isSelected?: boolean;
  onClick?: (date: Date) => void;
}

export function FitnessCalendarCell({
  date,
  dateKey,
  isCurrentMonth,
  dayInfo,
  isSelected = false,
  onClick,
}: FitnessCalendarCellProps) {
  const today = isToday(date) && isCurrentMonth;

  return (
    <button
      type="button"
      className={[
        'fp-cal-cell',
        !isCurrentMonth ? 'is-other-month' : '',
        today ? 'is-today' : '',
        isSelected ? 'is-selected' : '',
        dayInfo?.isRest ? 'is-rest' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick?.(date)}
    >
      <div className="fp-cal-cell__head">
        <span className="fp-cal-cell__day">{date.getDate()}</span>
        {dayInfo ? (
          <div className="fp-cal-cell__badges" aria-hidden>
            {dayInfo.badges.daily ? <span title="已打卡">🔥</span> : null}
            {dayInfo.badges.workout ? <span title="训练打卡">✓</span> : null}
            {dayInfo.badges.diet ? <span title="饮食记录">🍽</span> : null}
          </div>
        ) : null}
      </div>

      {isCurrentMonth && dayInfo ? (
        <div className="fp-cal-cell__body">
          {dayInfo.isRest ? (
            <span className="fp-cal-cell__rest">休息</span>
          ) : dayInfo.planName ? (
            <span className="fp-cal-cell__plan">{dayInfo.planName}</span>
          ) : (
            <span className="fp-cal-cell__empty">未安排</span>
          )}
          {dayInfo.isOverride ? <span className="fp-cal-cell__override">单日</span> : null}
        </div>
      ) : null}
    </button>
  );
}
