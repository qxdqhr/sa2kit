'use client';
import { useState, useCallback } from 'react';
import { IdeaListService } from '../services/ideaListService';
import type { UseIdeaItemsState, IdeaItemFormData, IdeaItem } from '../../../domain/types';

/**
 * 想法项目管理Hook
 * 提供项目的CRUD操作和状态管理
 */
export function useIdeaItems(listId?: number): UseIdeaItemsState {
  const [items, setItems] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentListId, setCurrentListId] = useState<number | undefined>(listId);

  /**
   * 刷新项目列表
   */
  const refreshItems = useCallback(async (showLoading = true) => {
    if (!listId) {
      if (currentListId !== listId) {
        setItems([]);
        setCurrentListId(listId);
      }
      setError(null);
      return;
    }
    
    // 如果是切换到新清单，立即清空当前项目，避免显示上一个清单的内容
    if (currentListId !== listId) {
      setItems([]);
      setCurrentListId(listId);
    }
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await IdeaListService.getItemsByListId(listId);
      setItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取项目失败';
      setError(errorMessage);
      console.error('获取想法项目失败:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [listId, currentListId]);

  /**
   * 创建新的想法项目
   */
  const createItem = useCallback(async (targetListId: number, data: IdeaItemFormData): Promise<boolean> => {
    setError(null);
    try {
      await IdeaListService.createItem(targetListId, data);
      
      // 如果创建的项目是当前列表的，则刷新
      if (targetListId === listId) {
        await refreshItems();
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建项目失败';
      setError(errorMessage);
      console.error('创建想法项目失败:', err);
      return false;
    }
  }, [listId, refreshItems]);

  /**
   * 更新想法项目
   */
  const updateItem = useCallback(async (id: number, data: Partial<IdeaItemFormData>): Promise<boolean> => {
    setError(null);
    try {
      await IdeaListService.updateItem(id, data);
      
      // 本地更新状态
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data, updatedAt: new Date() } : item
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新项目失败';
      setError(errorMessage);
      console.error('更新想法项目失败:', err);
      return false;
    }
  }, []);

  /**
   * 删除想法项目
   */
  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    try {
      await IdeaListService.deleteItem(id);
      
      // 本地更新状态
      setItems(prev => prev.filter(item => item.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除项目失败';
      setError(errorMessage);
      console.error('删除想法项目失败:', err);
      return false;
    }
  }, []);

  /**
   * 切换项目完成状态
   */
  const toggleComplete = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    try {
      const updatedItem = await IdeaListService.toggleItemComplete(id);
      
      // 本地更新状态
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换状态失败';
      setError(errorMessage);
      console.error('切换想法项目状态失败:', err);
      return false;
    }
  }, []);

  /**
   * 重新排序项目
   */
  const reorderItems = useCallback(async (targetListId: number, orderedIds: number[]): Promise<boolean> => {
    setError(null);
    try {
      // 本地更新状态（乐观更新）
      if (targetListId === listId) {
        const reorderedItems = orderedIds.map(id => 
          items.find(item => item.id === id)!
        ).filter(Boolean);
        
        setItems(reorderedItems);
      }
      
      // TODO: 实现后端排序API
      // await IdeaListService.reorderItems(targetListId, orderedIds);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重新排序失败';
      setError(errorMessage);
      console.error('重新排序想法项目失败:', err);
      
      // 恢复原始状态
      if (targetListId === listId) {
        await refreshItems();
      }
      return false;
    }
  }, [listId, items, refreshItems]);

  return {
    items,
    loading,
    error,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    reorderItems,
  };
} 