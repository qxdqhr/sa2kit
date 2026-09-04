'use client';

import { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { formatDate, isSameDay } from '../utils/dateUtils';

export interface DragState {
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  dragOverDate: Date | null;
  previewTime: string | null;
}

export interface UseEventDragReturn {
  dragState: DragState;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  resetDragState: () => void;
}

function parseTargetDateFromOverId(overId: string | number | undefined): Date | null {
  if (!overId || typeof overId !== 'string' || !overId.startsWith('date-')) {
    return null;
  }
  const dateStr = overId.replace('date-', '');
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  const targetDate = new Date(year, month - 1, day);
  return isNaN(targetDate.getTime()) ? null : targetDate;
}

function computeMovedTimes(
  draggedEvent: CalendarEvent,
  targetDate: Date
): { newStartTime: Date; newEndTime: Date } {
  const originalStart = new Date(draggedEvent.startTime);
  const originalEnd = new Date(draggedEvent.endTime);

  if (draggedEvent.allDay) {
    const newStartTime = new Date(targetDate);
    newStartTime.setHours(0, 0, 0, 0);
    const newEndTime = new Date(targetDate);
    newEndTime.setHours(23, 59, 59, 999);
    return { newStartTime, newEndTime };
  }

  const newStartTime = new Date(targetDate);
  newStartTime.setHours(
    originalStart.getHours(),
    originalStart.getMinutes(),
    originalStart.getSeconds(),
    originalStart.getMilliseconds()
  );
  const duration = originalEnd.getTime() - originalStart.getTime();
  const newEndTime = new Date(newStartTime.getTime() + duration);
  return { newStartTime, newEndTime };
}

/**
 * 事件拖拽 Hook
 */
export function useEventDrag(
  events: CalendarEvent[],
  onEventUpdate: (eventId: number, newStartTime: Date, newEndTime: Date) => Promise<void>
): UseEventDragReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedEvent: null,
    dragOverDate: null,
    previewTime: null,
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const eventId = parseInt(event.active.id as string, 10);
      const draggedEvent = events.find((e) => e.id === eventId);

      if (draggedEvent) {
        setDragState({
          isDragging: true,
          draggedEvent,
          dragOverDate: null,
          previewTime: null,
        });
      }
    },
    [events]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      const draggedEvent = dragState.draggedEvent;
      if (!over || !draggedEvent) return;

      const targetDate = parseTargetDateFromOverId(over.id);
      if (!targetDate) return;

      const { newStartTime, newEndTime } = computeMovedTimes(draggedEvent, targetDate);
      const previewTime = draggedEvent.allDay
        ? '全天'
        : `${formatTime(newStartTime)} - ${formatTime(newEndTime)}`;

      setDragState((prev) => ({
        ...prev,
        dragOverDate: targetDate,
        previewTime,
      }));
    },
    [dragState.draggedEvent]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const eventId = parseInt(active.id as string, 10);
      const draggedEvent = events.find((e) => e.id === eventId);

      const targetDate = parseTargetDateFromOverId(over?.id);

      if (draggedEvent && targetDate) {
        const originalStart = new Date(draggedEvent.startTime);
        if (!isSameDay(originalStart, targetDate)) {
          try {
            const { newStartTime, newEndTime } = computeMovedTimes(draggedEvent, targetDate);
            await onEventUpdate(draggedEvent.id, newStartTime, newEndTime);
          } catch (error) {
            console.error('拖拽更新事件失败:', error);
          }
        }
      }

      setDragState({
        isDragging: false,
        draggedEvent: null,
        dragOverDate: null,
        previewTime: null,
      });
    },
    [events, onEventUpdate]
  );

  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedEvent: null,
      dragOverDate: null,
      previewTime: null,
    });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    resetDragState,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
