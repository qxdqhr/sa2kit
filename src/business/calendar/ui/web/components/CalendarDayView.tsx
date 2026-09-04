'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { CalendarEvent } from '../types';
import { formatDate, isToday } from '../utils/dateUtils';
import { getEventSurfaceClasses, getPriorityLabel } from '../utils/eventDisplay';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import {
  formatTimeForSettings,
  getLunarDayLabel,
} from '../utils/calendarSettingsCore';
import { cal } from '../calendarStyles';
import { cn } from '../utils/cn';

export interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onCreate: () => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarDayView({
  currentDate,
  events,
  onCreate,
  onEventClick,
}: CalendarDayViewProps) {
  const { settings } = useCalendarSettings();

  const dayEvents = events
    .filter((e) => formatDate(new Date(e.startTime)) === formatDate(currentDate))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const isTodayDate = isToday(currentDate);
  const lunarLabel = settings.showLunarCalendar
    ? getLunarDayLabel(currentDate, settings.language)
    : null;

  return (
    <div
      className={`${cal.monthWrap} overflow-hidden`}
      style={{ backgroundColor: 'var(--cal-bg, rgb(247, 243, 223))' }}
    >
      <header className={cal.dayHeader}>
        <p className={`${cal.textMuted} text-xs font-semibold`}>
          {currentDate.toLocaleDateString(settings.language, { weekday: 'long' })}
        </p>
        <p
          className="mt-1 text-3xl font-semibold tabular-nums"
          style={{ color: isTodayDate ? 'var(--cal-primary, #7c3aed)' : 'var(--cal-text, #0f172a)' }}
        >
          {currentDate.getDate()}
        </p>
        <p className={`${cal.textBody} text-sm`}>
          {currentDate.toLocaleDateString(settings.language, {
            year: 'numeric',
            month: 'long',
          })}
        </p>
        {lunarLabel && <p className={`${cal.textMuted} mt-1 text-xs`}>农历 {lunarLabel}</p>}
        <p className={`${cal.textMuted} mt-2 text-xs`}>
          工作时间 {settings.workingHours.start} – {settings.workingHours.end}
        </p>
      </header>

      <div className="p-4">
        <button type="button" onClick={onCreate} className={`${cal.addDashed} mb-4`}>
          <Plus className="h-5 w-5" />
          添加活动
        </button>

        {dayEvents.length === 0 ? (
          <p className={`${cal.empty} py-8`}>今日暂无活动</p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => {
              const priority = getPriorityLabel(event.priority);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onEventClick(event)}
                    className={cn(cal.eventCard, 'w-full p-4 text-left', getEventSurfaceClasses(event.color))}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`${cal.textHeading} font-medium`}>{event.title}</h3>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs ${priority.className}`}
                      >
                        {priority.text}
                      </span>
                    </div>
                    <p className={`${cal.textMuted} mt-1 text-xs tabular-nums`}>
                      {event.allDay
                        ? '全天'
                        : `${formatTimeForSettings(new Date(event.startTime), settings)} – ${formatTimeForSettings(new Date(event.endTime), settings)}`}
                    </p>
                    {event.location && (
                      <p className={`${cal.textMuted} mt-1 truncate text-xs`}>{event.location}</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
