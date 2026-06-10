'use client';

import React, { useState } from 'react';
import type { ExperimentItem } from '../types';
import { clsx } from 'clsx';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableExperimentItem } from './SortableExperimentItem';

export interface DraggableExperimentGridProps {
  items: ExperimentItem[];
  onOrderChange?: (items: ExperimentItem[]) => void;
  className?: string;
}

export const DraggableExperimentGrid: React.FC<DraggableExperimentGridProps> = ({ 
  items: initialItems, 
  onOrderChange,
  className = '' 
}) => {
  // 本地状态跟踪项目顺序
  const [items, setItems] = useState<ExperimentItem[]>(initialItems);
  const [isDragging, setIsDragging] = useState(false);

  // 设置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖动8px才激活，避免意外触发
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 触摸需要按住250ms才激活，避免与点击冲突
        tolerance: 5, // 允许的移动容差
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽开始事件
  function handleDragStart() {
    setIsDragging(true);
  }

  // 处理拖拽结束事件
  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        // 找到拖拽项和目标项的索引
        const oldIndex = currentItems.findIndex(item => item.id === active.id);
        const newIndex = currentItems.findIndex(item => item.id === over.id);
        
        // 重新排序项目
        const newItems = arrayMove(currentItems, oldIndex, newIndex);
        
        // 如果提供了回调函数，通知父组件顺序变化
        if (onOrderChange) {
          onOrderChange(newItems);
        }
        
        return newItems;
      });
    }
  }

  // 处理向上移动
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      setItems((currentItems) => {
        const newItems = arrayMove(currentItems, index, index - 1);
        onOrderChange?.(newItems);
        return newItems;
      });
    }
  };

  // 处理向下移动
  const handleMoveDown = (index: number) => {
    if (index < items.length - 1) {
      setItems((currentItems) => {
        const newItems = arrayMove(currentItems, index, index + 1);
        onOrderChange?.(newItems);
        return newItems;
      });
    }
  };

  // 当初始项目变化时更新本地状态
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  return (
    <div className={clsx('relative', className)}>
      <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm">
        <div className="flex items-start sm:items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="mb-1">拖拽卡片可以自定义排序。点击卡片可以访问对应的实验项目。</p>
            <p className="text-xs text-blue-600 sm:hidden">点击卡片右上角的上下箭头按钮调整顺序</p>
            <p className="text-xs text-blue-600 hidden sm:block">长按卡片右上角的拖动图标进行排序</p>
          </div>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6', isDragging ? 'cursor-grabbing' : '')}>
            {items.map((item, index) => (
              <SortableExperimentItem 
                key={item.id} 
                item={item}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DraggableExperimentGrid;
