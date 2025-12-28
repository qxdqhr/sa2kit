'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CalendarEvent } from '../types';
import { formatTime } from '../utils/dateUtils';
import { useDeviceType } from '../utils/deviceUtils';

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
    : `${formatTime(new Date(event.startTime))} - ${formatTime(new Date(event.endTime))}`;

  // 事件颜色映射
  const getEventColorClasses = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'blue':
        return 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200';
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      case 'purple':
        return 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200';
      case 'pink':
        return 'bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-200';
      case 'indigo':
        return 'bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-200';
      case 'gray':
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200';
    }
  };

  // 优先级指示器
  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="高优先级" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" title="中优先级" />;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="低优先级" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded border-l-2 px-1 py-0.5 mb-0.5 
        ${dragSupported ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        transition-all duration-150 ease-in-out text-xs
        ${getEventColorClasses(event.color)}
        ${isDragActive || isDragging ? 'opacity-60 shadow-md z-40' : 'opacity-100'}
        ${className}
      `}
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
        {getPriorityIndicator(event.priority)}
        <span className="font-medium truncate flex-1">
          {event.title}
        </span>
        {!event.allDay && (
          <span className="text-xs opacity-60 whitespace-nowrap">
            {formatTime(new Date(event.startTime))}
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