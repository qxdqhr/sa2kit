'use client';

import React from 'react';
import { cn } from '../utils';

export interface FilterOption<T> {
  value: T;
  label: string;
  icon: string;
  activeColor: {
    bg: string;
    shadow: string;
  };
  count?: number;
  showCount?: boolean;
}

export interface FilterButtonGroupProps<T> {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

// 辅助函数：将 Tailwind 背景色类名转换为实际颜色值
function getColorValue(bgClass: string): string {
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981',
    'bg-red-500': '#ef4444',
    'bg-purple-500': '#8b5cf6',
    'bg-slate-500': '#64748b',
    'bg-emerald-500': '#10b981',
    'bg-orange-500': '#f97316',
  };
  return colorMap[bgClass] || '#3b82f6'; // 默认蓝色
}

export function FilterButtonGroup<T extends string>({ 
  label, 
  value, 
  options, 
  onChange,
  className
}: FilterButtonGroupProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-800">
        {label}
      </h3>

      <div className="flex gap-3">
        {options.map((option) => {
          const isActive = value === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={isActive ? { backgroundColor: getColorValue(option.activeColor.bg) } : undefined}
              className={cn(
                "flex-1 h-12 rounded-lg font-medium text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-opacity-50 border",
                isActive
                  ? "text-white border-transparent shadow-md focus:ring-white"
                  : "bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow focus:ring-blue-300"
              )}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{option.icon}</span>
                <span>{option.label}</span>
                {option.showCount && option.count !== undefined && (
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center",
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    {option.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

