'use client';

import React from 'react';
import { cn } from '../utils';

export interface SearchResultHintProps {
  searchQuery: string;
  resultCount: number;
  className?: string;
}

export function SearchResultHint({ searchQuery, resultCount, className }: SearchResultHintProps) {
  if (!searchQuery) return null;

  return (
    <div className={cn("mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", className)}>
      <p className="text-sm text-blue-700">
        搜索 "<span className="font-medium">{searchQuery}</span>" 
        找到 {resultCount} 个结果
      </p>
    </div>
  );
}

export default SearchResultHint;

