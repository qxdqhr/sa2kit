'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface OrderableItem {
  id: number;
}

export interface OrderManagerOperations<T extends OrderableItem> {
  loadItems: () => Promise<T[]>;
  moveItemUp: (id: number) => Promise<void>;
  moveItemDown: (id: number) => Promise<void>;
  updateItemOrder: (orders: { id: number; order: number }[]) => Promise<void>;
}

export interface GenericOrderManagerProps<T extends OrderableItem> {
  operations: OrderManagerOperations<T>;
  renderItem: (
    item: T,
    index: number,
    isFirst: boolean,
    isLast: boolean,
  ) => React.ReactNode;
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
  loadingMessage = '加载数据...',
}: GenericOrderManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [originalOrder, setOriginalOrder] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

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

  useEffect(() => {
    const hasOrderChanged = items.some(
      (item, index) => originalOrder[index]?.id !== item.id,
    );
    setHasChanges(hasOrderChanged);
  }, [items, originalOrder]);

  const handleMoveUp = async (itemId: number) => {
    try {
      setError(null);

      const currentIndex = items.findIndex((item) => item.id === itemId);
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

  const handleMoveDown = async (itemId: number) => {
    try {
      setError(null);

      const currentIndex = items.findIndex((item) => item.id === itemId);
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

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

  const handleResetOrder = () => {
    setItems([...originalOrder]);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-12 text-gray-500',
          className,
        )}
      >
        <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
        <span>{loadingMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-gray-100 bg-white p-6 shadow-md',
        className,
      )}
    >
      <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
        <h3 className="m-0 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex w-full gap-3 sm:w-auto">
          {hasChanges && (
            <>
              <button
                type="button"
                onClick={handleResetOrder}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600"
                title="重置为原始顺序"
              >
                <RotateCcw size={16} />
                重置
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="color-slate-500 m-0 mb-2 text-sm">{description}</p>
        <ul className="color-slate-500 m-0 list-disc pl-6 text-sm">
          <li className="mb-1">
            使用拖拽：点击并拖动{' '}
            <GripVertical
              size={14}
              className="inline-block align-middle text-gray-500"
            />{' '}
            图标
          </li>
          <li className="mb-1">
            使用按钮：点击{' '}
            <ChevronUp
              size={14}
              className="inline-block align-middle text-gray-500"
            />{' '}
            或{' '}
            <ChevronDown
              size={14}
              className="inline-block align-middle text-gray-500"
            />{' '}
            按钮
          </li>
          <li>完成调整后，点击&quot;保存顺序&quot;按钮保存更改</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-300 hover:shadow-sm',
              draggedItem === index && 'rotate-2 border-blue-500 opacity-50',
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex cursor-grab items-center rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing">
              <GripVertical size={20} />
            </div>

            <div className="min-w-0 flex-1">
              {renderItem(
                item,
                index,
                index === 0,
                index === items.length - 1,
              )}
            </div>

            <div className="mx-3 flex items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white sm:h-8 sm:w-8 sm:text-sm">
                #{index + 1}
              </span>
            </div>

            <div className="flex flex-row gap-1 sm:flex-col">
              <button
                type="button"
                onClick={() => handleMoveUp(item.id)}
                disabled={index === 0}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white p-0 text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-40 sm:h-8 sm:w-8"
                title="上移"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(item.id)}
                disabled={index === items.length - 1}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white p-0 text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-40 sm:h-8 sm:w-8"
                title="下移"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="p-12 text-center italic text-gray-400">
          <p className="m-0">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
