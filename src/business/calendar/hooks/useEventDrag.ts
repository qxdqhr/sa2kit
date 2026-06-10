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

/**
 * 事件拖拽Hook
 * 
 * 提供事件拖拽功能，支持：
 * - 拖拽事件到不同日期
 * - 拖拽时显示预览信息
 * - 拖拽状态管理
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

  // 处理拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const eventId = parseInt(event.active.id as string);
    const draggedEvent = events.find(e => e.id === eventId);
    
    console.log('🎯 拖拽开始:', {
      activeId: event.active.id,
      eventId,
      draggedEvent: draggedEvent ? {
        id: draggedEvent.id,
        title: draggedEvent.title,
        originalStartTime: draggedEvent.startTime,
        originalDate: formatDate(new Date(draggedEvent.startTime))
      } : null
    });
    
    if (draggedEvent) {
      setDragState({
        isDragging: true,
        draggedEvent,
        dragOverDate: null,
        previewTime: null,
      });
    }
  }, [events]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    console.log('🔍 拖拽悬停:', {
      overId: over?.id,
      hasOver: !!over,
      hasDraggedEvent: !!dragState.draggedEvent
    });
    
    if (over && dragState.draggedEvent) {
      const targetDateStr = over.id as string;
      
      console.log('📅 解析目标日期:', {
        targetDateStr,
        startsWithDate: targetDateStr.startsWith('date-')
      });
      
      // 解析目标日期 (格式: "date-2024-12-28")
      if (targetDateStr.startsWith('date-')) {
        const dateStr = targetDateStr.replace('date-', '');
        // 使用本地时区解析日期，避免时区偏移
        const parts = dateStr.split('-').map(Number);
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];

        if (year !== undefined && month !== undefined && day !== undefined) {
          const targetDate = new Date(year, month - 1, day);
          
          console.log('🗓️ 日期解析结果:', {
            dateStr,
            parsedComponents: { year, month: month - 1, day },
            targetDate: targetDate.toISOString(),
            isValidDate: !isNaN(targetDate.getTime()),
            formattedTargetDate: formatDate(targetDate)
          });
          
          if (!isNaN(targetDate.getTime())) {
            const originalStart = new Date(dragState.draggedEvent.startTime);
            const originalEnd = new Date(dragState.draggedEvent.endTime);
            
            // 计算新的开始和结束时间，保持原有的时间部分
            const newStartTime = new Date(targetDate);
            newStartTime.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds());
            
            const duration = originalEnd.getTime() - originalStart.getTime();
            const newEndTime = new Date(newStartTime.getTime() + duration);
            
            // 生成预览时间文本
            const previewTime = dragState.draggedEvent.allDay 
              ? '全天'
              : (formatTime(newStartTime)) + ' - ' + (formatTime(newEndTime));
            
            console.log('⏰ 计算新时间:', {
              originalStart: dragState.draggedEvent.startTime,
              originalEnd: dragState.draggedEvent.endTime,
              newStartTime: newStartTime.toISOString(),
              newEndTime: newEndTime.toISOString(),
              duration: duration / (1000 * 60), // 转换为分钟
              previewTime
            });
            
            setDragState(prev => ({
              ...prev,
              dragOverDate: targetDate,
              previewTime,
            }));
          }
        }
      }
    }
  }, [dragState.draggedEvent]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event;
    
    console.log('🎯 拖拽结束:', {
      overId: over?.id,
      hasOver: !!over,
      hasDraggedEvent: !!dragState.draggedEvent,
      hasDragOverDate: !!dragState.dragOverDate,
      dragOverDate: dragState.dragOverDate ? formatDate(dragState.dragOverDate) : null
    });
    
    if (over && dragState.draggedEvent && dragState.dragOverDate) {
      const originalStart = new Date(dragState.draggedEvent.startTime);
      const originalEnd = new Date(dragState.draggedEvent.endTime);
      const targetDate = dragState.dragOverDate;
      
      // 检查是否真的移动到了不同的日期
      const isSameDayResult = isSameDay(originalStart, targetDate);
      console.log('📊 日期比较:', {
        originalDate: formatDate(originalStart),
        targetDate: formatDate(targetDate),
        isSameDay: isSameDayResult
      });
      
      if (!isSameDayResult) {
        try {
          // 计算新的开始和结束时间，保持原有的时间部分
          const newStartTime = new Date(targetDate);
          newStartTime.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds());
          
          const duration = originalEnd.getTime() - originalStart.getTime();
          const newEndTime = new Date(newStartTime.getTime() + duration);
          
          // 调用更新函数
          console.log('✅ 执行拖拽更新事件:', {
            eventId: dragState.draggedEvent.id,
            originalDate: formatDate(originalStart),
            targetDate: formatDate(targetDate),
            originalStartTime: originalStart.toISOString(),
            originalEndTime: originalEnd.toISOString(),
            newStartTime: newStartTime.toISOString(),
            newEndTime: newEndTime.toISOString(),
            duration: duration / (1000 * 60) // 分钟
          });
          await onEventUpdate(dragState.draggedEvent.id, newStartTime, newEndTime);
        } catch (error) {
          console.error('❌ 拖拽更新事件失败:', error);
          // 这里可以显示错误提示
        }
      } else {
        console.log('⚠️ 跳过更新 - 日期相同或条件不满足');
      }
    } else {
      console.log('⚠️ 拖拽结束但缺少必要条件:', {
        hasOver: !!over,
        hasDraggedEvent: !!dragState.draggedEvent,
        hasDragOverDate: !!dragState.dragOverDate
      });
    }
    
    // 重置拖拽状态
    console.log('🔄 重置拖拽状态');
    resetDragState();
  }, [dragState.draggedEvent, dragState.dragOverDate, onEventUpdate]);

  // 重置拖拽状态
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

// 辅助函数：格式化时间
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
} 