'use client';

import React from 'react';
import type { SortMode } from '../types';

export interface SortModeToggleProps {
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
}

export const SortModeToggle: React.FC<SortModeToggleProps> = ({ sortMode, onSortModeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <span className="text-sm font-medium text-gray-700">排序模式：</span>
      
      <div className="flex w-full sm:w-auto p-1 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-sm rounded-md transition-colors ${
            sortMode === 'auto'
              ? 'bg-white text-blue-700 font-medium shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => onSortModeChange('auto')}
        >
          <div className="flex items-center justify-center sm:justify-start space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            <span>自动排序</span>
          </div>
        </button>
        
        <button
          className={`flex-1 sm:flex-initial px-3 py-1.5 text-sm rounded-md transition-colors ${
            sortMode === 'manual'
              ? 'bg-white text-blue-700 font-medium shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => onSortModeChange('manual')}
        >
          <div className="flex items-center justify-center sm:justify-start space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <span>手动排序</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SortModeToggle;
