'use client';

import React from "react";

export interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onClearSearch, className }) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <svg 
        className="mx-auto h-12 w-12 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.904-6.06 2.384" 
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到匹配的实验项目</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchQuery 
          ? '尝试调整搜索关键词或筛选条件' 
          : '当前分类下暂无实验项目'
        }
      </p>
      {searchQuery && (
        <div className="mt-4">
          <button
            onClick={onClearSearch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            清除搜索
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
