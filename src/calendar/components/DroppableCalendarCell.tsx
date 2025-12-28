'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { formatDate, isSameDay, isToday } from '../utils/dateUtils';
import DraggableEvent from './DraggableEvent';

interface DroppableCalendarCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isSelected?: boolean;
  dragOverPreview?: string | null;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  className?: string;
  disableDrop?: boolean;
}

/**
 * 可放置的日历单元格组件
 * 
 * 功能特性：
 * - 支持拖拽事件到此日期
 * - 显示当前日期的所有事件
 * - 拖拽悬停时显示预览
 * - 响应式设计
 */
export const DroppableCalendarCell: React.FC<DroppableCalendarCellProps> = ({
  date,
  events,
  isCurrentMonth,
  isSelected = false,
  dragOverPreview,
  onEventClick,
  onDateClick,
  className = '',
  disableDrop = false
}) => {
  const dateStr = formatDate(date);
  const dropId = `date-${dateStr}`;
  
  // 只在支持拖拽时启用可放置功能
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: dropId,
    data: {
      date,
      dateStr,
    },
    disabled: disableDrop,
  });

  // 调试日志
  if (isOver) {
    console.log('📍 拖拽悬停在单元格:', {
      dropId,
      date: dateStr,
      isCurrentMonth,
      dayOfWeek: date.getDay()
    });
  }

  // 获取当前日期的事件
  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.startTime), date)
  );

  // 样式计算
  const getCellClasses = () => {
    const baseClasses = [
      'relative w-full h-full p-2',
      'transition-all duration-200 ease-in-out',
      'hover:bg-gray-50 cursor-pointer',
      className
    ];

    // 当前月份样式
    if (!isCurrentMonth) {
      baseClasses.push('bg-gray-100 text-gray-400');
    }

    // 今天的样式
    if (isToday(date)) {
      baseClasses.push('bg-blue-100 ring-2 ring-blue-400 ring-inset');
    }

    // 选中日期样式
    if (isSelected) {
      baseClasses.push('ring-2 ring-blue-400 ring-inset');
    }

    // 拖拽悬停样式
    if (isOver) {
      baseClasses.push('bg-blue-100 ring-2 ring-blue-300 ring-inset shadow-lg');
    }

    return baseClasses.join(' ');
  };

  return (
    <div
      ref={disableDrop ? undefined : setNodeRef}
      className={getCellClasses()}
      onClick={() => onDateClick?.(date)}
    >
      {/* 日期数字 */}
      <div className="flex items-center justify-between mb-2">
        <span className={`
          inline-flex items-center justify-center text-sm font-semibold w-6 h-6
          ${!isCurrentMonth ? 'text-gray-400' : 
            (date.getDay() === 0 || date.getDay() === 6) ? 'text-red-600' : 'text-gray-900'}
          ${isToday(date) ? 'bg-blue-600 text-white rounded-full shadow-md' : ''}
        `}>
          {date.getDate()}
        </span>
        
        {/* 事件数量指示器 */}
        {dayEvents.length > 0 && (
          <span className="bg-yellow-500 inline-flex items-center justify-center text-sm font-semibold w-6 h-6 border border-white 'bg-blue-600 text-white rounded-full shadow-md">
            {dayEvents.length}
          </span>
        )}
      </div>

      {/* 事件列表 */}
      <div className="space-y-1">
        {dayEvents.slice(0, 3).map((event) => (
          <DraggableEvent
            key={event.id}
            event={event}
            className="text-xs"
            onClick={() => {
              onEventClick?.(event);
            }}
          />
        ))}
        
        {/* 更多事件指示器 */}
        {dayEvents.length > 3 && (
          <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
            +{dayEvents.length - 3} 更多
          </div>
        )}
      </div>

      {/* 拖拽预览 */}
      {isOver && dragOverPreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg border-2 border-dashed border-blue-300">
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600 mb-1">
              移动到 {date.getMonth() + 1}/{date.getDate()}
            </div>
            <div className="text-xs text-blue-500">
              {dragOverPreview}
            </div>
          </div>
        </div>
      )}

      {/* 新建事件提示 */}
      {isOver && !dragOverPreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-50 bg-opacity-90 rounded-lg border-2 border-dashed border-green-300">
          <div className="text-center">
            <div className="text-sm font-medium text-green-600">
              点击创建事件
            </div>
            <div className="text-xs text-green-500">
              {date.getMonth() + 1}/{date.getDate()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableCalendarCell; 