'use client';

import React from 'react';

type ProgressBarProps = {
  completed: number;
  total: number;
  className?: string;
};

export function ProgressBar({ completed, total, className = '' }: ProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(100, Math.round((completed / safeTotal) * 100));
  return (
    <div className={className}>
      <div className="mb-1 flex justify-between text-xs text-[#7a6f5c]">
        <span>
          {completed} / {total} 课已完成
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eee8dc]" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2c5282] to-[#4299e1] transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
