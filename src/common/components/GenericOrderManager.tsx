'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  GripVertical, 
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils';

export interface OrderableItem {
  id: number;
  [key: string]: any;
}

export interface OrderManagerOperations<T extends OrderableItem> {
  loadItems: () => Promise<T[]>;
  moveItemUp: (id: number) => Promise<void>;
  moveItemDown: (id: number) => Promise<void>;
  updateItemOrder: (orders: { id: number; order: number }[]) => Promise<void>;
}

export interface GenericOrderManagerProps<T extends OrderableItem> {
  operations: OrderManagerOperations<T>;
  renderItem: (item: T, index: number, isFirst: boolean, isLast: boolean) => React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  onOrderChanged?: () => void;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function GenericOrderManager<T extends OrderableItem>({
  operations,
  renderItem,
  className = '',
  title = '顺序管理',
  description = '拖拽或使用按钮调整显示顺序',
  onOrderChanged,
  emptyMessage = '暂无数据',
  loadingMessage = '加载数据...'
}: GenericOrderManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [originalOrder, setOriginalOrder] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // 加载数据
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await operations.loadItems();
      
      setItems(data);
      setOriginalOrder([...data]);
      setHasChanges(false);
    } catch (err) {
      console.error('❌ [通用排序] 加载数据错误:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [operations]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // 检查是否有变更
  useEffect(() => {
    const hasOrderChanged = items.some((item, index) => 
      originalOrder[index]?.id !== item.id
    );
    setHasChanges(hasOrderChanged);
  }, [items, originalOrder]);

  // 上移项目
  const handleMoveUp = async (itemId: number) => {
    try {
      setError(null);
      
      const currentIndex = items.findIndex(item => item.id === itemId);
      if (currentIndex === -1) {
        setError('项目不存在');
        return;
      }
      if (currentIndex === 0) {
        setError('项目已经在最前面，无法上移');
        return;
      }
      
      await operations.moveItemUp(itemId);
      await loadItems();
      onOrderChanged?.();
      
    } catch (err) {
      console.error('❌ [通用排序] 上移项目错误:', err);
      setError(err instanceof Error ? err.message : '上移失败');
    }
  };

  // 下移项目
  const handleMoveDown = async (itemId: number) => {
    try {
      setError(null);
      
      const currentIndex = items.findIndex(item => item.id === itemId);
      if (currentIndex === -1) {
        setError('项目不存在');
        return;
      }
      if (currentIndex === items.length - 1) {
        setError('项目已经在最后面，无法下移');
        return;
      }
      
      await operations.moveItemDown(itemId);
      await loadItems();
      onOrderChanged?.();
      
    } catch (err) {
      console.error('❌ [通用排序] 下移项目错误:', err);
      setError(err instanceof Error ? err.message : '下移失败');
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖拽悬停
  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 拖拽放置
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    try {
      setError(null);
      
      const newItems = [...items];
      const draggedItemData = newItems[draggedItem];
      if (!draggedItemData) return;
      
      newItems.splice(draggedItem, 1);
      newItems.splice(dropIndex, 0, draggedItemData);
      
      const itemOrders = newItems.map((item, index) => ({
        id: item.id,
        order: index,
      }));
      
      await operations.updateItemOrder(itemOrders);
      await loadItems();
      onOrderChanged?.();
      
    } catch (err) {
      console.error('❌ [通用排序] 拖拽排序错误:', err);
      setError(err instanceof Error ? err.message : '排序失败');
    } finally {
      setDraggedItem(null);
    }
  };

  // 保存新顺序
  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const itemOrders = items.map((item, index) => ({
        id: item.id,
        order: index,
      }));

      await operations.updateItemOrder(itemOrders);
      
      setOriginalOrder([...items]);
      setHasChanges(false);
      onOrderChanged?.();
    } catch (err) {
      console.error('❌ [通用排序] 保存顺序错误:', err);
      setError(err instanceof Error ? err.message : '保存失败');
      await loadItems();
    } finally {
      setSaving(false);
    }
  };

  // 重置顺序
  const handleResetOrder = () => {
    setItems([...originalOrder]);
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 text-gray-500", className)}>
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-2" />
        <span>{loadingMessage}</span>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl p-6 shadow-md border-2 border-gray-100", className)}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 sm:flex-row flex-col sm:items-center items-start gap-4">
        <h3 className="m-0 text-gray-900 text-lg font-semibold">{title}</h3>
        <div className="flex gap-3 w-full sm:w-auto">
          {hasChanges && (
            <>
              <button
                onClick={handleResetOrder}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                title="重置为原始顺序"
              >
                <RotateCcw size={16} />
                重置
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                title="保存新顺序"
              >
                <Save size={16} />
                {saving ? '保存中...' : '保存顺序'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg mb-4 border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <p className="m-0 mb-2 color-slate-500 text-sm">{description}</p>
        <ul className="m-0 pl-6 color-slate-500 text-sm list-disc">
          <li className="mb-1">使用拖拽：点击并拖动 <GripVertical size={14} className="inline-block align-middle text-gray-500" /> 图标</li>
          <li className="mb-1">使用按钮：点击 <ChevronUp size={14} className="inline-block align-middle text-gray-500" /> 或 <ChevronDown size={14} className="inline-block align-middle text-gray-500" /> 按钮</li>
          <li>完成调整后，点击"保存顺序"按钮保存更改</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg transition-all hover:border-gray-300 hover:shadow-sm",
              draggedItem === index && "opacity-50 rotate-2 border-blue-500"
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex items-center cursor-grab active:cursor-grabbing text-gray-400 p-1 rounded hover:text-gray-500 hover:bg-gray-100 transition-colors">
              <GripVertical size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              {renderItem(item, index, index === 0, index === items.length - 1)}
            </div>

            <div className="flex items-center mx-3">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm font-semibold rounded-full sm:w-8 sm:h-8 w-7 h-7 sm:text-sm text-xs">
                #{index + 1}
              </span>
            </div>

            <div className="flex flex-col gap-1 sm:flex-col flex-row">
              <button
                onClick={() => handleMoveUp(item.id)}
                disabled={index === 0}
                className="flex items-center justify-center w-8 h-8 p-0 border border-gray-300 bg-white text-gray-500 rounded cursor-pointer transition-all hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 sm:w-8 sm:h-8 w-7 h-7"
                title="上移"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={() => handleMoveDown(item.id)}
                disabled={index === items.length - 1}
                className="flex items-center justify-center w-8 h-8 p-0 border border-gray-300 bg-white text-gray-500 rounded cursor-pointer transition-all hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 sm:w-8 sm:h-8 w-7 h-7"
                title="下移"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center p-12 text-gray-400 italic">
          <p className="m-0">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

