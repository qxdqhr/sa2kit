/**
 * useMasterpieces Hook - 画集数据管理和浏览状态管理
 * 
 * 这是一个自定义React Hook，提供了完整的画集数据管理和浏览功能。
 * 主要用于ShowMasterpiece模块的前端页面，封装了所有与画集相关的状态和操作。
 * 
 * 主要功能：
 * - 画集数据的加载和缓存
 * - 画集浏览状态管理（当前选中的画集、当前页面等）
 * - 翻页操作（上一页、下一页、跳转）
 * - 搜索功能
 * - 错误处理和加载状态管理
 * 
 * 性能优化：
 * - 内存缓存机制，减少重复API调用
 * - 使用useCallback优化函数引用稳定性
 * - 懒加载和按需加载
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   selectedCollection,
 *   currentPage,
 *   loading,
 *   selectCollection,
 *   nextPage,
 *   prevPage
 * } = useMasterpieces();
 * ```
 * 
 * @returns {Object} Hook返回的状态和方法集合
 */

import { useState, useEffect, useCallback } from 'react';
import { ArtCollection } from '../types';
import { MasterpiecesService } from '../services/masterpiecesService';

// ===== 数据缓存配置 =====

/** 画集数据缓存存储 */
let collectionsCache: ArtCollection[] | null = null;

/** 缓存时间戳，用于判断缓存是否过期 */
let collectionsCacheTime = 0;

/** 缓存持续时间：3分钟 */
const COLLECTIONS_CACHE_DURATION = 3 * 60 * 1000; // 3分钟缓存

/**
 * useMasterpieces Hook 主体函数
 * 
 * 提供画集数据管理和浏览状态管理的完整解决方案。
 * 包含状态管理、数据获取、缓存机制和用户交互功能。
 * 
 */
export const useMasterpieces = () => {
  // ===== 状态管理 =====
  
  /** 所有画集数据列表 */
  const [collections, setCollections] = useState<ArtCollection[]>([]);
  
  /** 当前选中的画集（null表示在画集列表页面） */
  const [selectedCollection, setSelectedCollection] = useState<ArtCollection | null>(null);
  
  /** 当前查看的作品页面索引（从0开始） */
  const [currentPage, setCurrentPage] = useState(0);
  
  /** 数据加载状态 */
  const [loading, setLoading] = useState(false);
  
  /** 错误信息（null表示无错误） */
  const [error, setError] = useState<string | null>(null);

  // ===== 数据加载方法 =====
  
  /**
   * 加载所有画集数据
   * 
   * 支持缓存机制，避免重复的网络请求。
   * 如果缓存有效，直接使用缓存数据；否则从服务器获取新数据。
   * 
   * @param forceRefresh - 是否强制刷新，忽略缓存
   */
  const loadCollections = useCallback(async (forceRefresh = false) => {
    try {
      // 检查缓存是否有效
      const now = Date.now();
      if (!forceRefresh && collectionsCache && (now - collectionsCacheTime) < COLLECTIONS_CACHE_DURATION) {
        setCollections(collectionsCache);
        return;
      }

      setLoading(true);
      setError(null);
      
      // 调用服务获取数据
      const data = await MasterpiecesService.getAllCollections();
      
      // 更新缓存
      collectionsCache = data;
      collectionsCacheTime = now;
      
      setCollections(data);
    } catch (err) {
      setError('加载画集失败');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== 画集浏览操作 =====
  
  /**
   * 选择一个画集进行查看
   * 
   * 设置当前选中的画集，并重置页面索引为第一页。
   * 
   * @param collection - 要查看的画集对象
   */
  const selectCollection = useCallback((collection: ArtCollection) => {
    setSelectedCollection(collection);
    setCurrentPage(0); // 重置到第一页
  }, []);

  /**
   * 切换到下一页作品
   * 
   * 检查是否还有下一页，如果有则切换到下一页。
   * 自动处理边界条件，不会超出作品总数。
   */
  const nextPage = useCallback(() => {
    if (selectedCollection && currentPage < selectedCollection.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [selectedCollection, currentPage]);

  /**
   * 切换到上一页作品
   * 
   * 检查是否还有上一页，如果有则切换到上一页。
   * 自动处理边界条件，不会低于第一页。
   */
  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  /**
   * 跳转到指定页面的作品
   * 
   * 直接跳转到指定的页面索引。
   * 包含边界检查，确保索引在有效范围内。
   * 
   * @param pageIndex - 目标页面索引（从0开始）
   */
  const goToPage = useCallback((pageIndex: number) => {
    if (selectedCollection && pageIndex >= 0 && pageIndex < selectedCollection.pages.length) {
      setCurrentPage(pageIndex);
    }
  }, [selectedCollection]);

  /**
   * 返回画集列表页面
   * 
   * 清除当前选中的画集，回到画集列表视图。
   * 同时重置页面索引。
   */
  const backToGallery = useCallback(() => {
    setSelectedCollection(null);
    setCurrentPage(0);
  }, []);

  // ===== 搜索功能 =====
  
  /**
   * 搜索画集
   * 
   * 根据关键词搜索画集，支持标题、作者、描述等字段的模糊匹配。
   * 搜索结果会替换当前的画集列表。
   * 
   * @param query - 搜索关键词
   */
  const searchCollections = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await MasterpiecesService.searchCollections(query);
      setCollections(data);
    } catch (err) {
      setError('搜索失败');
      console.error('Error searching collections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== 辅助方法 =====
  
  /**
   * 获取当前正在查看的作品
   * 
   * 根据当前选中的画集和页面索引，返回对应的作品对象。
   * 如果没有选中画集或索引无效，返回null。
   * 
   * @returns 当前作品对象或null
   */
  const getCurrentArtwork = useCallback(() => {
    if (!selectedCollection || !selectedCollection.pages[currentPage]) {
      return null;
    }
    return selectedCollection.pages[currentPage];
  }, [selectedCollection, currentPage]);

  // ===== 计算属性 =====
  
  /** 是否可以切换到下一页 */
  const canGoNext = selectedCollection ? currentPage < selectedCollection.pages.length - 1 : false;
  
  /** 是否可以切换到上一页 */
  const canGoPrev = currentPage > 0;

  // ===== 初始化 =====
  
  /**
   * 组件挂载时自动加载画集数据
   */
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // ===== 返回值 =====
  
  return {
    // === 状态数据 ===
    /** 所有画集数据 */
    collections,
    /** 当前选中的画集 */
    selectedCollection,
    /** 当前页面索引 */
    currentPage,
    /** 加载状态 */
    loading,
    /** 错误信息 */
    error,
    
    // === 计算属性 ===
    /** 获取当前作品的方法 */
    getCurrentArtwork,
    /** 是否可以下一页 */
    canGoNext,
    /** 是否可以上一页 */
    canGoPrev,
    
    // === 操作方法 ===
    /** 选择画集 */
    selectCollection,
    /** 下一页 */
    nextPage,
    /** 上一页 */
    prevPage,
    /** 跳转到指定页 */
    goToPage,
    /** 返回画集列表 */
    backToGallery,
    /** 搜索画集 */
    searchCollections,
    /** 加载画集数据 */
    loadCollections,
  };
}; 
