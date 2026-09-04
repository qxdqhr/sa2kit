'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { formatTimeForSettings } from '../utils/calendarSettingsCore';
import { useDeviceType } from '../utils/deviceUtils';
import { getEventSurfaceClasses } from '../utils/eventDisplay';
import { EventPriority } from '../types';

interface DraggableEventProps {
  event: CalendarEvent;
  isDragging?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * 可拖拽的事件组件
 * 
 * 功能特性：
 * - 支持拖拽移动事件（桌面端）
 * - 移动端禁用拖拽功能
 * - 拖拽时显示半透明效果
 * - 保持原有的点击功能
 * - 响应式设计
 */
export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  isDragging = false,
  className = '',
  onClick,
  children
}) => {
  // 检测设备类型
  const { isMobile, dragSupported } = useDeviceType();
  const { settings } = useCalendarSettings();
  
  // 只在支持拖拽的设备上启用拖拽功能
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDragActive,
  } = useDraggable({
    id: event.id.toString(),
    data: {
      event,
    },
    disabled: !dragSupported, // 移动端禁用拖拽
  });

  // 计算拖拽时的样式变换
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // 格式化显示时间
  const displayTime = event.allDay
    ? '全天'
    : `${formatTimeForSettings(new Date(event.startTime), settings)} - ${formatTimeForSettings(new Date(event.endTime), settings)}`;

  const showPriorityDot =
    event.priority === EventPriority.HIGH || event.priority === EventPriority.URGENT;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group relative mb-0.5 rounded-md px-1 py-0.5 text-xs',
        dragSupported ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        'transition-[opacity,transform] duration-150',
        getEventSurfaceClasses(event.color),
        isDragActive || isDragging ? 'z-40 opacity-60 shadow-md' : 'opacity-100',
        className,
      ].join(' ')}
      // 只在支持拖拽时应用拖拽事件监听器
      {...(dragSupported ? listeners : {})}
      {...(dragSupported ? attributes : {})}
      onClick={onClick}
    >
      {/* 拖拽指示器 - 只在桌面端显示 */}
      {dragSupported && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg 
            className="w-3 h-3 text-gray-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      )}

      {/* 移动端操作提示 */}
      {isMobile && (
        <div className="absolute top-1 right-1 opacity-70">
          <svg 
            className="w-3 h-3 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
            />
          </svg>
        </div>
      )}

      {/* 事件内容 - 紧凑模式 */}
      <div className="flex items-center gap-1">
        {showPriorityDot && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" title="高优先级" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">
          {event.title}
        </span>
        {!event.allDay && (
          <span className="text-xs opacity-60 whitespace-nowrap">
            {formatTimeForSettings(new Date(event.startTime), settings)}
          </span>
        )}
      </div>

      {/* 自定义子内容 */}
      {children}

      {/* 拖拽时的反馈效果 */}
      {isDragActive && (
        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default DraggableEvent; 