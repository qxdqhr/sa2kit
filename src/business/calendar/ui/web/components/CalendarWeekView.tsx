'use client';

import React, { useMemo } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { CalendarEvent } from '../types';
import {
  getWeekViewDates,
  formatDate,
  isToday,
  getWeekdayName,
} from '../utils/dateUtils';
import { getEventSurfaceClasses, getPriorityLabel } from '../utils/eventDisplay';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import {
  formatTimeForSettings,
  getLunarDayLabel,
  type CalendarSettings,
} from '../utils/calendarSettingsCore';
import { cal } from '../calendarStyles';
import { cn } from '../utils/cn';

export interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onShowDayEvents: (date: Date) => void;
}

function formatEventTimeRange(event: CalendarEvent, settings: CalendarSettings) {
  if (event.allDay) return '全天';
  const start = formatTimeForSettings(new Date(event.startTime), settings);
  const end = formatTimeForSettings(new Date(event.endTime), settings);
  return `${start} – ${end}`;
}

export default function CalendarWeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onShowDayEvents,
}: CalendarWeekViewProps) {
  const { settings } = useCalendarSettings();
  const weekDates = getWeekViewDates(currentDate, settings.weekStartsOn);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const date of weekDates) {
      map.set(formatDate(date), []);
    }
    for (const event of events) {
      const key = formatDate(new Date(event.startTime));
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(event);
      }
    }
    for (const [, dayEvents] of map) {
      dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    return map;
  }, [events, weekDates]);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  return (
    <div
      className={cn(cal.monthWrap, 'flex h-full min-h-0 flex-col overflow-hidden')}
      style={{ backgroundColor: 'var(--cal-bg, rgb(247, 243, 223))' }}
    >
      <header className={cal.weekHeader}>
        <p className={`${cal.textBody} text-sm font-semibold`}>本周日程</p>
        <p className={`${cal.textMuted} mt-0.5 text-xs tabular-nums`}>
          {weekStart.toLocaleDateString(settings.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {' – '}
          {weekEnd.toLocaleDateString(settings.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cal.weekDayRow}>
        {weekDates.map((date) => {
          const dateKey = formatDate(date);
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isTodayDate = isToday(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const lunarLabel = settings.showLunarCalendar
            ? getLunarDayLabel(date, settings.language)
            : null;

          return (
            <section
              key={dateKey}
              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:gap-4 sm:px-4 sm:py-4"
              style={{
                backgroundColor: isTodayDate
                  ? 'var(--cal-today-bg, #f5f3ff)'
                  : isWeekend
                    ? 'var(--cal-weekend-bg, #ffffff)'
                    : 'var(--cal-cell-bg, #ffffff)',
              }}
            >
              <button
                type="button"
                onClick={() => onDateClick(date)}
                className="group flex shrink-0 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-white/60 sm:w-36 sm:flex-col sm:items-start sm:gap-1 sm:px-2 sm:py-2"
              >
                <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide sm:text-sm"
                    style={{
                      color: isWeekend
                        ? 'var(--cal-weekend-text, #dc2626)'
                        : 'var(--cal-text-muted, #64748b)',
                    }}
                  >
                    {getWeekdayName(date, settings.language, 'short')}
                  </span>
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold tabular-nums sm:h-10 sm:w-10 ${
                      isTodayDate ? 'text-white shadow-sm' : ''
                    }`}
                    style={
                      isTodayDate
                        ? { backgroundColor: 'var(--cal-primary, #7c3aed)' }
                        : { color: 'var(--cal-text, #1e293b)' }
                    }
                  >
                    {date.getDate()}
                  </span>
                </div>
                <div className="min-w-0 sm:w-full">
                  <p className={`${cal.textMuted} text-xs tabular-nums`}>
                    {date.toLocaleDateString(settings.language, { month: 'short', day: 'numeric' })}
                  </p>
                  {lunarLabel && (
                    <p className={`${cal.textMuted} mt-0.5 text-[10px]`}>农历 {lunarLabel}</p>
                  )}
                  <p className={`${cal.textMuted} mt-1 hidden text-[10px] text-[#11a89b] opacity-0 transition-opacity group-hover:opacity-100 sm:block`}>
                    点击新建
                  </p>
                </div>
              </button>

              <div className="min-w-0 flex-1">
                {dayEvents.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onDateClick(date)}
                    className={`${cal.addDashed} h-12`}
                  >
                    <Plus className="h-4 w-4" />
                    暂无活动，点击添加
                  </button>
                ) : (
                  <ul className="space-y-2">
                    {dayEvents.map((event) => {
                      const priority = getPriorityLabel(event.priority);
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => onEventClick(event)}
                            className={cn(
                              cal.eventCard,
                              'w-full px-3 py-2.5 text-left sm:px-4 sm:py-3',
                              getEventSurfaceClasses(event.color),
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className={`${cal.textHeading} truncate text-sm sm:text-base`}>
                                  {event.title}
                                </h3>
                                <p className={`${cal.textMuted} mt-0.5 text-xs tabular-nums sm:text-sm`}>
                                  {formatEventTimeRange(event, settings)}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:text-xs ${priority.className}`}
                              >
                                {priority.text}
                              </span>
                            </div>
                            {event.description && (
                              <p className={`${cal.textBody} mt-1.5 line-clamp-2 text-xs`}>
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className={`${cal.textMuted} mt-1 flex items-center gap-1 text-xs`}>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {dayEvents.length > 4 && (
                  <button
                    type="button"
                    onClick={() => onShowDayEvents(date)}
                    className={`${cal.cellOverflow} mt-2 text-xs`}
                  >
                    查看全部 {dayEvents.length} 项
                  </button>
                )}
              </div>
            </section>
          );
        })}
        </div>
      </div>
    </div>
  );
}
