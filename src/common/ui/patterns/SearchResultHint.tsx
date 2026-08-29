'use client';

import React from 'react';
import { cn } from '../cn';

export type SearchResultHintProps = {
  searchQuery: string;
  resultCount: number;
  className?: string;
};

export function SearchResultHint({ searchQuery, resultCount, className }: SearchResultHintProps) {
  if (!searchQuery) return null;

  return (
    <div
      className={cn(
        'mb-6 rounded-[18px] border-2 border-[var(--sa2-primary,#19c8b9)]/30 bg-[var(--sa2-primary-bg,#e6f9f6)] p-4',
        className,
      )}
    >
      <p className="m-0 text-sm text-[var(--sa2-text,#794f27)]">
        搜索「<span className="font-semibold">{searchQuery}</span>」找到 {resultCount} 个结果
      </p>
    </div>
  );
}
