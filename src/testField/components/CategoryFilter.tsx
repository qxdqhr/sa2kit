'use client';

import React from "react";
import type { ViewMode } from '../types';
import { getCategoryDisplayName } from '../utils';
import { FilterButtonGroup } from '@/components/FilterButtonGroup';

interface CategoryFilterProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  counts: { utility: number; leisure: number };
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  viewMode, 
  onViewModeChange, 
  counts,
  className
}) => {
  const options = [
    {
      value: 'all' as const,
      label: getCategoryDisplayName('all'),
      icon: '📊',
      activeColor: {
        bg: 'bg-blue-500',
        shadow: 'shadow-blue-200'
      },
      showCount: false
    },
    {
      value: 'utility' as const,
      label: getCategoryDisplayName('utility'),
      icon: '🔧',
      activeColor: {
        bg: 'bg-green-500',
        shadow: 'shadow-green-200'
      },
      count: counts.utility,
      showCount: true
    },
    {
      value: 'leisure' as const,
      label: getCategoryDisplayName('leisure'),
      icon: '🎮',
      activeColor: {
        bg: 'bg-purple-500',
        shadow: 'shadow-purple-200'
      },
      count: counts.leisure,
      showCount: true
    },
  ];

  return (
    <FilterButtonGroup
      label="项目类别"
      value={viewMode}
      options={options}
      onChange={onViewModeChange}
      className={className}
    />
  );
};

export default CategoryFilter;
