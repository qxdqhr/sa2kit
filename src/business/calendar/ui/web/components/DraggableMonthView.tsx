'use client';

import React, { useMemo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { useEventDrag } from '../hooks/useEventDrag';
import { useDeviceType } from '../utils/deviceUtils';
import { getMonthViewDates, getWeekdayName } from '../utils/dateUtils';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import {
  getISOWeekNumber,
  isWeekendColumn,
} from '../utils/calendarSettingsCore';
import DroppableCalendarCell from './DroppableCalendarCell';
import DraggableEvent from './DraggableEvent';
import { cal } from '../calendarStyles';
import { cn } from '../utils/cn';

interface DraggableMonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onShowDayEvents?: (date: Date) => void;
  onEventUpdate: (eventId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export const DraggableMonthView: React.FC<DraggableMonthViewProps> = ({
  events,
  currentDate,
  onEventClick,
  onDateClick,
  onShowDayEvents,
  onEventUpdate,
  className = '',
}) => {
  const { isMobile, dragSupported } = useDeviceType();
  const { settings } = useCalendarSettings();

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useEventDrag(events, dragSupported ? onEventUpdate : async () => {});

  const monthDays = useMemo(() => {
    const dates = getMonthViewDates(currentDate, settings.weekStartsOn);
    return dates.map((date) => ({
      date,
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
    }));
  }, [currentDate, settings.weekStartsOn]);

  const weekDays = useMemo(
    () =>
      monthDays
        .slice(0, 7)
        .map((d) => getWeekdayName(d.date, settings.language, 'short')),
    [monthDays, settings.language]
  );

  const maxVisible = isMobile ? 1 : 2;

  const grid = (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] table-fixed border-collapse">
        <thead>
          <tr>
            {settings.showWeekNumbers && (
              <th className={cn(cal.monthTheadTh, 'w-10')}>
                周
              </th>
            )}
            {weekDays.map((day, index) => (
              <th
                key={`${day}-${index}`}
                className={cal.monthTheadTh}
                style={{
                  color: isWeekendColumn(index, settings.weekStartsOn)
                    ? 'var(--cal-weekend-text, #dc2626)'
                    : 'var(--cal-text, #334155)',
                }}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.replace('周', '')}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, weekIndex) => {
            const rowStart = monthDays[weekIndex * 7];
            const weekNumber = rowStart ? getISOWeekNumber(rowStart.date) : null;

            return (
              <tr key={weekIndex}>
                {settings.showWeekNumbers && (
                  <td className={cn(cal.monthRowCell, cal.weekNum, 'py-2 text-center align-middle text-xs sm:text-sm')}>
                    {weekNumber}
                  </td>
                )}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayData = monthDays[weekIndex * 7 + dayIndex];
                  if (!dayData) {
                    return (
                      <td
                        key={dayIndex}
                        colSpan={settings.showWeekNumbers && dayIndex === 0 ? 1 : 1}
                        className={cn(cal.monthRowCell, 'min-h-[3.5rem] align-top sm:min-h-[5.5rem]')}
                        style={{ backgroundColor: 'var(--cal-other-month-bg, #f8fafc)' }}
                      />
                    );
                  }
                  return (
                    <td key={dayIndex} className={cn(cal.monthRowCell, 'align-top p-0')}>
                      <DroppableCalendarCell
                        date={dayData.date}
                        events={events}
                        isCurrentMonth={dayData.isCurrentMonth}
                        dragOverPreview={dragSupported ? dragState.previewTime : null}
                        onEventClick={onEventClick}
                        onDateClick={onDateClick}
                        onShowDayEvents={onShowDayEvents}
                        disableDrop={!dragSupported}
                        maxVisibleEvents={maxVisible}
                        className="h-full min-h-[3.5rem] border-0 sm:min-h-[5.5rem]"
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      className={cn(cal.monthWrap, 'overflow-hidden', className)}
      style={{ backgroundColor: 'var(--cal-bg, rgb(247, 243, 223))' }}
    >
      {dragSupported && !isMobile && (
        <p className={cal.gridHint}>
          桌面端可拖拽活动调整日期
        </p>
      )}

      {dragSupported ? (
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {grid}
          <DragOverlay>
            {dragState.isDragging && dragState.draggedEvent && (
              <div className="pointer-events-none rotate-1 scale-105">
                <DraggableEvent
                  event={dragState.draggedEvent}
                  isDragging
                  className="shadow-lg ring-1 ring-[#19c8b9]"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        grid
      )}

      {dragSupported && dragState.isDragging && (
        <div className={cal.dragHint}>
          拖到目标日期以移动「{dragState.draggedEvent?.title}」
        </div>
      )}
    </div>
  );
};

export default DraggableMonthView;
