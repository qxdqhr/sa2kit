'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { formatDate, isSameDay, isToday } from '../utils/dateUtils';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { getLunarDayLabel } from '../utils/calendarSettingsCore';
import DraggableEvent from './DraggableEvent';
import { useDeviceType } from '../utils/deviceUtils';
import { cal } from '../calendarStyles';
import { cn } from '../utils/cn';

interface DroppableCalendarCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isSelected?: boolean;
  dragOverPreview?: string | null;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onShowDayEvents?: (date: Date) => void;
  className?: string;
  disableDrop?: boolean;
  maxVisibleEvents?: number;
}

export const DroppableCalendarCell: React.FC<DroppableCalendarCellProps> = ({
  date,
  events,
  isCurrentMonth,
  isSelected = false,
  dragOverPreview,
  onEventClick,
  onDateClick,
  onShowDayEvents,
  className = '',
  disableDrop = false,
  maxVisibleEvents = 2,
}) => {
  const { isMobile } = useDeviceType();
  const dateStr = formatDate(date);
  const dropId = `date-${dateStr}`;

  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: { date, dateStr },
    disabled: disableDrop,
  });

  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.startTime), date)
  );
  const { settings } = useCalendarSettings();
  const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
  const overflowCount = dayEvents.length - visibleEvents.length;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const lunarLabel = settings.showLunarCalendar
    ? getLunarDayLabel(date, settings.language)
    : null;
  const todayCell = isToday(date) && isCurrentMonth;

  const handleCellClick = () => {
    if (isMobile && dayEvents.length > 0) {
      onShowDayEvents?.(date);
      return;
    }
    onDateClick?.(date);
  };

  return (
    <div
      ref={disableDrop ? undefined : setNodeRef}
      role="button"
      tabIndex={0}
      onClick={handleCellClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCellClick();
        }
      }}
      className={cn(
        'relative flex h-full min-h-[3.5rem] w-full flex-col p-1 sm:min-h-[5.5rem] sm:p-1.5',
        'cursor-pointer transition-[background-color,box-shadow] duration-200',
        (isSelected || isOver) && cal.selectedRing,
        className,
      )}
      style={{
        backgroundColor: isOver
          ? 'color-mix(in srgb, var(--cal-primary, #7c3aed) 12%, var(--cal-cell-bg, #ffffff))'
          : !isCurrentMonth
            ? 'var(--cal-other-month-bg, #f8fafc)'
            : todayCell
              ? 'var(--cal-today-bg, #f5f3ff)'
              : isWeekend
                ? 'var(--cal-weekend-bg, #ffffff)'
                : 'var(--cal-cell-bg, #ffffff)',
        color: !isCurrentMonth
          ? 'var(--cal-text-muted, #94a3b8)'
          : isWeekend
            ? 'var(--cal-weekend-text, #dc2626)'
            : 'var(--cal-text, #1e293b)',
      }}
    >
      <div className="mb-0.5 flex items-center justify-between gap-0.5">
        <div className="flex min-w-0 flex-col items-start leading-none">
          <span
            className={[
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-sm',
              todayCell ? 'text-white shadow-sm' : '',
            ].join(' ')}
            style={
              todayCell
                ? { backgroundColor: 'var(--cal-primary, #7c3aed)' }
                : undefined
            }
          >
            {date.getDate()}
          </span>
          {lunarLabel && isCurrentMonth && (
            <span className={`${cal.textMuted} mt-0.5 max-w-[2.5rem] truncate text-[9px] sm:text-[10px]`}>
              {lunarLabel}
            </span>
          )}
        </div>
        {dayEvents.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowDayEvents?.(date);
            }}
            className="flex h-6 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white sm:h-7 sm:min-w-[1.5rem] sm:text-xs"
            style={{ backgroundColor: 'var(--cal-primary, #7c3aed)' }}
            aria-label={`${dayEvents.length} 个活动，点击查看`}
          >
            {dayEvents.length}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="min-w-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DraggableEvent
              event={event}
              className="text-[10px] sm:text-xs"
              onClick={() => onEventClick?.(event)}
            />
          </div>
        ))}
        {overflowCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowDayEvents?.(date);
            }}
            className={cal.cellOverflow}
          >
            +{overflowCount} 项
          </button>
        )}
      </div>

      {isOver && dragOverPreview && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[#19c8b9] bg-[rgba(230,249,246,0.85)]">
          <span className="text-xs font-semibold text-[#117a72]">{dragOverPreview}</span>
        </div>
      )}
    </div>
  );
};

export default DroppableCalendarCell;
