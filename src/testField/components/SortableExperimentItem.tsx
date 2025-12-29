'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExperimentCard } from '@/portfolio/ExperimentCard';
import type { ExperimentItem } from '../types';

export interface SortableExperimentItemProps {
  item: ExperimentItem;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const SortableExperimentItem: React.FC<SortableExperimentItemProps> = ({ 
  item, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* 拖拽手柄 - 桌面端 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md z-10
                  hidden sm:flex
                  opacity-0 group-hover:opacity-100 transition-opacity
                  cursor-grab active:cursor-grabbing
                  touch-action-none" /* 防止触摸设备上的滚动冲突 */
        onClick={(e) => e.stopPropagation()}
        aria-label="拖动排序"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        
        <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          拖动排序
        </span>
      </div>

      {/* 移动端排序按钮组 */}
      <div className="absolute right-2 top-2 flex flex-col gap-2 sm:hidden z-10">
        {/* 向上按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp?.();
          }}
          disabled={isFirst}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md
                     ${isFirst ? 'bg-gray-200 cursor-not-allowed' : 'bg-white/80 hover:bg-white active:bg-gray-100'}`}
          aria-label="向上移动"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFirst ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* 向下按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown?.();
          }}
          disabled={isLast}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md
                     ${isLast ? 'bg-gray-200 cursor-not-allowed' : 'bg-white/80 hover:bg-white active:bg-gray-100'}`}
          aria-label="向下移动"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLast ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 实验卡片 */}
      <div className={`transition-all ${isDragging ? 'scale-105 shadow-xl' : ''}`}>
        <ExperimentCard
          href={item.path}
          title={item.title}
          description={item.description}
          tags={item.tags}
          category={item.category as any}
          isCompleted={item.isCompleted}
          updatedAt={item.updatedAt}
          createdAt={item.createdAt}
        />
      </div>
    </div>
  );
};

export default SortableExperimentItem;
