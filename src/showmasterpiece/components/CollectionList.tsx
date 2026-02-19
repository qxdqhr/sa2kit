/**
 * ShowMasterpiece 模块 - 画集列表组件
 * 
 * 用于预订页面展示画集简略信息，包括：
 * - 画集封面和标题
 * - 艺术家信息
 * - 价格显示
 * - 选择功能
 * 
 * @fileoverview 画集列表组件
 */

'use client';

import React from 'react';
import { CollectionSummary } from '../types/booking';

/**
 * 画集列表组件属性
 */
interface CollectionListProps {
  /** 画集列表 */
  collections: CollectionSummary[];
  
  /** 当前选中的画集ID */
  selectedCollectionId?: number;
  
  /** 选择画集回调 */
  onSelectCollection?: (collectionId: number) => void;
  
  /** 加载状态 */
  loading?: boolean;
  
  /** 是否禁用选择 */
  disabled?: boolean;
}

/**
 * 画集列表组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const CollectionList: React.FC<CollectionListProps> = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
  loading = false,
  disabled = false,
}) => {
  /**
   * 处理画集选择
   * 
   * @param collectionId 画集ID
   */
  const handleCollectionSelect = (collectionId: number) => {
    if (!disabled && onSelectCollection) {
      onSelectCollection(collectionId);
    }
  };

  /**
   * 格式化价格显示
   * 
   * @param price 价格
   * @returns 格式化后的价格字符串
   */
  const formatPrice = (price?: number): string => {
    if (price === undefined || price === null) {
      return '价格待定';
    }
    if (price === 0) {
      return '免费';
    }
    return `¥${price}`;
  };

  /**
   * 加载状态渲染
   */
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-md mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * 空状态渲染
   */
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🎨</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无可用画集</h3>
        <p className="text-gray-500">当前没有可预订的画集，请稍后再试</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className={`
            relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer
            transition-all duration-200 hover:shadow-lg
            ${selectedCollectionId === collection.id 
              ? 'ring-2 ring-blue-500 shadow-lg' 
              : 'hover:ring-1 hover:ring-gray-300'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
          onClick={() => handleCollectionSelect(collection.id)}
        >
          {/* 选中状态指示器 */}
          {selectedCollectionId === collection.id && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}

          {/* 画集封面 */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={collection.coverImage}
              alt={collection.title}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-artwork.jpg';
              }}
            />
            
            {/* 价格标签 */}
            <div className="absolute bottom-2 left-2">
              <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
                {formatPrice(collection.price)}
              </span>
            </div>
          </div>

          {/* 画集信息 */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {collection.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              编号：{collection.number}
            </p>
            {collection.description && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {collection.description}
              </p>
            )}
          </div>

          {/* 选择提示 */}
          {!disabled && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
              <span className="text-blue-600 font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">
                点击选择
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 