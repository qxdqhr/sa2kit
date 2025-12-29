'use client';

import React from 'react';
import type { TestFieldConfig } from '../types';

export interface SortControlProps {
  sortBy: TestFieldConfig['sortBy'];
  sortOrder: TestFieldConfig['sortOrder'];
  onSortByChange: (sortBy: TestFieldConfig['sortBy']) => void;
  onSortOrderChange: (sortOrder: TestFieldConfig['sortOrder']) => void;
}

export const SortControl: React.FC<SortControlProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  // 排序方式选项
  const sortOptions: { value: TestFieldConfig['sortBy']; label: string }[] = [
    { value: 'title', label: '名称' },
    { value: 'updatedAt', label: '更新时间' },
    { value: 'createdAt', label: '创建时间' },
    { value: 'category', label: '类别' },
    { value: 'completion', label: '完成状态' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="text-sm font-medium text-gray-700">排序方式：</div>
      
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              sortBy === option.value
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => onSortByChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      <div className="ml-auto flex items-center">
        <button
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span>升序</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <span>降序</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SortControl;
